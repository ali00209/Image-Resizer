import { handleImage } from './imageHandling.js';
import { toggleTheme } from './theme.js';
import { resizeImage } from './main.js';
import { debounce, showToast } from './utils.js';
import { elements, state } from './state.js';
import { downloadMultipleSizes } from './download.js';
import { history } from './history.js';

function setupDragAndDrop() {
    elements.preview.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.preview.style.borderColor = '#4CAF50';
    });

    elements.preview.addEventListener('dragleave', (e) => {
        e.preventDefault();
        elements.preview.style.borderColor = '#ccc';
    });

    elements.preview.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.preview.style.borderColor = '#ccc';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImage(file);
        } else {
            showToast('Please drop a valid image file', 'error');
        }
    });
}

function setupDimensionInputs() {
    elements.widthInput.addEventListener('input', debounce(() => {
        if (!state.originalImageData) {
            showToast('Please upload an image first', 'error');
            elements.widthInput.value = '';
            return;
        }

        const width = parseInt(elements.widthInput.value);
        if (width > 8000) {
            elements.widthInput.value = 8000;
        }
        
        if (state.isLocked && state.originalWidth && state.originalHeight) {
            const currentWidth = parseInt(elements.widthInput.value);
            const ratio = state.originalHeight / state.originalWidth;
            const newHeight = Math.round(currentWidth * ratio);
            elements.heightInput.value = newHeight;
        }
        
        resizeImage(parseInt(elements.widthInput.value), parseInt(elements.heightInput.value));
    }, 300));

    elements.heightInput.addEventListener('input', debounce(() => {
        if (!state.originalImageData) {
            showToast('Please upload an image first', 'error');
            elements.heightInput.value = '';
            return;
        }

        const height = parseInt(elements.heightInput.value);
        if (height > 8000) {
            elements.heightInput.value = 8000;
        }
        
        if (state.isLocked && state.originalWidth && state.originalHeight) {
            const currentHeight = parseInt(elements.heightInput.value);
            const ratio = state.originalWidth / state.originalHeight;
            const newWidth = Math.round(currentHeight * ratio);
            elements.widthInput.value = newWidth;
        }
        
        resizeImage(parseInt(elements.widthInput.value), height);
    }, 300));
}

function setupButtons() {
    elements.lockAspectRatio.addEventListener('click', () => {
        if (!state.originalImageData) {
            showToast('Please upload an image first', 'error');
            return;
        }
        state.isLocked = !state.isLocked;
        const lockIcon = elements.lockAspectRatio.querySelector('i');
        lockIcon.className = state.isLocked ? 'ph ph-lock' : 'ph ph-lock-open';
        elements.lockAspectRatio.classList.toggle('locked', state.isLocked);
    });

    // Original button handler
    elements.originalBtn.addEventListener('click', () => {
        if (!state.initialImageData) {
            showToast('Please upload an image first', 'error');
            return;
        }

        // Reset to initial state
        elements.previewImage.src = state.initialImageData;
        state.originalImageData = state.initialImageData;
        state.originalWidth = state.initialWidth;
        state.originalHeight = state.initialHeight;
        elements.widthInput.value = state.initialWidth;
        elements.heightInput.value = state.initialHeight;

        // Add to history
        if (history) {
            history.push(state.initialImageData, state.initialWidth, state.initialHeight);
        }

        showToast('Reset to original size');
    });
}

function setupThemeToggle() {
    elements.themeToggle.addEventListener('click', toggleTheme);
}

function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            showToast('Please select a valid image file', 'error');
            e.target.value = ''; // Clear the input
            return;
        }
        handleImage(file);
    }
}

function checkImageLoaded() {
    const isLoaded = !!state.originalImageData;
    if (!isLoaded) {
        showToast('Please upload an image first', 'error');
    }
    return isLoaded;
}

export {
    setupDragAndDrop,
    setupDimensionInputs,
    setupButtons,
    setupThemeToggle,
    handleImageSelect,
    checkImageLoaded
};