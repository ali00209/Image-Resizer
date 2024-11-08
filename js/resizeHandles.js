import { elements, state } from './state.js';
import { resizeImage } from './main.js';
import { showToast } from './utils.js';
import { history } from './history.js';
import { createResizedImage } from './imageHandling.js';

let isResizing = false;
let currentHandle = null;
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;
let aspectRatio = 1;
let resizeRAF = null;
let lastResizeTime = 0;
let pendingResize = null;
let previewImage = null;

function initializeResizeHandles() {
    if (!elements.preview) return;

    // Create resize handles container
    const handlesContainer = document.createElement('div');
    handlesContainer.className = 'resize-handles';
    elements.preview.appendChild(handlesContainer);

    // Create preview image for smooth resizing
    previewImage = document.createElement('img');
    previewImage.className = 'resize-preview';
    previewImage.style.display = 'none';
    elements.preview.appendChild(previewImage);

    // Add only corner handles
    const positions = ['nw', 'ne', 'se', 'sw'];
    positions.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `resize-handle ${pos}`;
        handle.setAttribute('data-handle', pos);
        handle.setAttribute('aria-label', `Resize handle ${pos}`);
        handlesContainer.appendChild(handle);
    });

    setupResizeEvents();
    updateHandlesVisibility(false);
}

function setupResizeEvents() {
    const handles = document.querySelectorAll('.resize-handle');
    
    handles.forEach(handle => {
        handle.addEventListener('mousedown', startResize);
        handle.addEventListener('touchstart', handleTouchStart, { passive: false });
    });

    document.addEventListener('mousemove', handleResize);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mouseup', endResize);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('mouseleave', endResize);
}

function startResize(e) {
    if (!state.originalImageData) {
        showToast('Please upload an image first', 'error');
        return;
    }

    isResizing = true;
    currentHandle = e.target.dataset.handle;
    
    const rect = elements.previewImage.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startWidth = rect.width;
    startHeight = rect.height;
    aspectRatio = state.originalWidth / state.originalHeight;

    // Show preview image during resize
    previewImage.src = state.originalImageData;
    previewImage.style.width = `${startWidth}px`;
    previewImage.style.height = `${startHeight}px`;
    previewImage.style.display = 'block';
    elements.previewImage.style.visibility = 'hidden';

    document.body.style.cursor = getResizeCursor(currentHandle);
    document.body.classList.add('resizing');
    e.target.classList.add('active');
    e.preventDefault();

    // Clear any pending resize
    if (resizeRAF) {
        cancelAnimationFrame(resizeRAF);
    }
    if (pendingResize) {
        clearTimeout(pendingResize);
    }
}

function handleResize(e) {
    if (!isResizing) return;

    // Use requestAnimationFrame for smooth visual updates
    if (resizeRAF) {
        cancelAnimationFrame(resizeRAF);
    }

    resizeRAF = requestAnimationFrame(() => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        let newWidth = startWidth;
        let newHeight = startHeight;

        switch (currentHandle) {
            case 'se':
                newWidth = startWidth + deltaX;
                newHeight = state.isLocked ? newWidth / aspectRatio : startHeight + deltaY;
                break;
            case 'sw':
                newWidth = startWidth - deltaX;
                newHeight = state.isLocked ? newWidth / aspectRatio : startHeight + deltaY;
                break;
            case 'ne':
                newWidth = startWidth + deltaX;
                newHeight = state.isLocked ? newWidth / aspectRatio : startHeight - deltaY;
                break;
            case 'nw':
                newWidth = startWidth - deltaX;
                newHeight = state.isLocked ? newWidth / aspectRatio : startHeight - deltaY;
                break;
        }

        // Apply minimum and maximum size constraints
        newWidth = Math.max(50, Math.min(8000, newWidth));
        newHeight = Math.max(50, Math.min(8000, newHeight));

        // Update preview image size
        previewImage.style.width = `${newWidth}px`;
        previewImage.style.height = `${newHeight}px`;

        // Update input fields immediately for smooth UI
        elements.widthInput.value = Math.round(newWidth);
        elements.heightInput.value = Math.round(newHeight);
    });
}

async function endResize() {
    if (!isResizing) return;
    
    isResizing = false;
    document.body.style.cursor = '';
    document.body.classList.remove('resizing');
    
    const handle = document.querySelector('.resize-handle.active');
    if (handle) {
        handle.classList.remove('active');
    }

    // Cancel any pending animations
    if (resizeRAF) {
        cancelAnimationFrame(resizeRAF);
    }
    if (pendingResize) {
        clearTimeout(pendingResize);
    }

    // Hide preview image and show actual image
    previewImage.style.display = 'none';
    elements.previewImage.style.visibility = 'visible';

    // Apply final resize using current image data
    const width = parseInt(elements.widthInput.value);
    const height = parseInt(elements.heightInput.value);
    
    try {
        const resizedImageUrl = await createResizedImage(width, height, state.originalImageData);
        elements.previewImage.src = resizedImageUrl;
        state.originalImageData = resizedImageUrl;
        state.originalWidth = width;
        state.originalHeight = height;

        // Add final state to history
        if (history) {
            history.push(resizedImageUrl, width, height);
        }
    } catch (error) {
        showToast('Error applying resize', 'error');
    }
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    startResize(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isResizing) return;
    
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    handleResize(mouseEvent);
}

function handleTouchEnd(e) {
    if (!isResizing) return;
    
    e.preventDefault();
    endResize();
}

function getResizeCursor(handle) {
    const cursors = {
        nw: 'nw-resize',
        ne: 'ne-resize',
        se: 'se-resize',
        sw: 'sw-resize'
    };
    return cursors[handle] || 'default';
}

function updateHandlesVisibility(show) {
    const handles = document.querySelector('.resize-handles');
    if (handles) {
        handles.style.display = show ? 'block' : 'none';
    }
}

export { initializeResizeHandles, updateHandlesVisibility }; 