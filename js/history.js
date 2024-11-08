import { elements, state } from './state.js';
import { showToast } from './utils.js';
import { updatePreviewOverlay } from './preview.js';

export let history;

class HistoryState {
    constructor(imageData, width, height) {
        this.imageData = imageData;
        this.width = Math.round(width);
        this.height = Math.round(height);
        this.initialWidth = state.initialWidth;
        this.initialHeight = state.initialHeight;
        this.initialImageData = state.initialImageData;
        this.timestamp = Date.now();
    }

    isSignificantlyDifferent(other) {
        if (!other) return true;

        const widthDiff = Math.abs(this.width - other.width);
        const heightDiff = Math.abs(this.height - other.height);
        const timeDiff = this.timestamp - other.timestamp;
        const isDifferentImage = this.imageData !== other.imageData;
        
        return isDifferentImage || 
               widthDiff > 5 || 
               heightDiff > 5 || 
               timeDiff > 1000;
    }

    toString() {
        return `${this.width}×${this.height}`;
    }
}

class History {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxStates = 30;
        this.isApplyingState = false;
        this.debounceTimeout = null;
        this.lastPushTime = 0;
    }

    push(imageData, width, height) {
        if (this.isApplyingState) return;

        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }

        this.debounceTimeout = setTimeout(() => {
            const currentState = new HistoryState(imageData, width, height);
            const lastState = this.undoStack[this.undoStack.length - 1];

            if (currentState.isSignificantlyDifferent(lastState)) {
                if (this.redoStack.length > 0) {
                    this.redoStack = [];
                }

                this.undoStack.push(currentState);
                this.lastPushTime = Date.now();
                
                if (this.undoStack.length > this.maxStates) {
                    this.undoStack.shift();
                }

                this.updateButtons();
            }
        }, 300);
    }

    undo() {
        if (this.undoStack.length <= 1) {
            showToast('Nothing to undo', 'error');
            return;
        }

        const currentState = this.undoStack.pop();
        this.redoStack.push(currentState);

        const previousState = this.undoStack[this.undoStack.length - 1];
        this.applyState(previousState, 'Undo');
    }

    redo() {
        if (this.redoStack.length === 0) {
            showToast('Nothing to redo', 'error');
            return;
        }

        const nextState = this.redoStack.pop();
        this.undoStack.push(nextState);
        this.applyState(nextState, 'Redo');
    }

    applyState(historyState) {
        try {
            this.isApplyingState = true;

            elements.previewImage.src = historyState.imageData;
            elements.widthInput.value = Math.round(historyState.width);
            elements.heightInput.value = Math.round(historyState.height);
            
            state.originalImageData = historyState.imageData;
            state.originalWidth = Math.round(historyState.width);
            state.originalHeight = Math.round(historyState.height);
            
            state.initialWidth = historyState.initialWidth;
            state.initialHeight = historyState.initialHeight;
            state.initialImageData = historyState.initialImageData;

            updatePreviewOverlay(Math.round(historyState.width), Math.round(historyState.height));
            this.updateButtons();
        } catch (error) {
            showToast('Error applying changes', 'error');
        } finally {
            this.isApplyingState = false;
        }
    }

    updateButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');

        if (undoBtn) {
            const canUndo = this.undoStack.length > 1;
            undoBtn.disabled = !canUndo;
            undoBtn.classList.toggle('disabled', !canUndo);
            undoBtn.title = canUndo ? 'Undo (Ctrl+Z)' : 'Nothing to undo';
        }

        if (redoBtn) {
            const canRedo = this.redoStack.length > 0;
            redoBtn.disabled = !canRedo;
            redoBtn.classList.toggle('disabled', !canRedo);
            redoBtn.title = canRedo ? 'Redo (Ctrl+Y)' : 'Nothing to redo';
        }
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
        this.updateButtons();
    }
}

function initializeHistory() {
    history = new History();

    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');

    undoBtn.addEventListener('click', () => history.undo());
    redoBtn.addEventListener('click', () => history.redo());

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;

        if (e.ctrlKey || e.metaKey) {
            if (!e.shiftKey && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                history.undo();
            } else if (
                (e.shiftKey && e.key.toLowerCase() === 'z') ||
                e.key.toLowerCase() === 'y'
            ) {
                e.preventDefault();
                history.redo();
            }
        }
    });

    return history;
}

export { initializeHistory };