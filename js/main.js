import { debounce, showToast, showLoading, hideLoading } from './utils.js';
import { validateDimensions } from './validation.js';
import { handleImage, createResizedImage } from './imageHandling.js';
import { initializePreview, updatePreviewOverlay } from './preview.js';
import { initializeTheme } from './theme.js';
import { setupDragAndDrop, setupDimensionInputs, setupButtons, setupThemeToggle, handleImageSelect } from './eventHandlers.js';
import { downloadMultipleSizes } from './download.js';
import { setupAspectRatios } from './aspectRatio.js';
import { elements, state } from './state.js';
import { initializeCropTool } from './crop.js';
import { initializeHistory, history } from './history.js';
import { initializeSidebar } from './sidebar.js';
import { initializeAccessibility } from './accessibility.js';
import { initializePresets } from './presets.js';
import { initializeResizeHandles, updateHandlesVisibility } from './resizeHandles.js';

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializePreview();
    initializeTheme();
    setupEventListeners();
    setupAspectRatios();
    initializeCropTool();
    initializeHistory();
    setupDownloadButton();
    initializeSidebar();
    initializeAccessibility();
    initializePresets();
    initializeResizeHandles();
});

function setupEventListeners() {
    elements.imageInput.addEventListener('change', handleImageSelect);
    setupDragAndDrop();
    setupDimensionInputs();
    setupButtons();
    setupThemeToggle();
}

function setupDownloadButton() {
    elements.downloadBtn.addEventListener('click', async () => {
        if (!state.originalImageData || elements.previewImage.src === '') {
            showToast('Please load an image first', 'error');
            return;
        }

        const commonSizes = document.querySelectorAll('#common-sizes .size-checkbox:checked');
        const iconSizes = document.querySelectorAll('#icon-sizes .size-checkbox:checked');

        if (commonSizes.length > 0 && iconSizes.length > 0) {
            await downloadMultipleSizes('both');
        } else if (commonSizes.length > 0) {
            await downloadMultipleSizes('common');
        } else if (iconSizes.length > 0) {
            await downloadMultipleSizes('icons');
        } else {
            await downloadMultipleSizes('single');
        }
    });
}

// Main resize function
async function resizeImage(width, height) {
    const errors = validateDimensions(width, height);
    if (errors.length > 0) {
        errors.forEach(error => showToast(error, 'error'));
        return;
    }

    updatePreviewOverlay(width, height);
    updateHandlesVisibility(true); // Show resize handles after resizing
    
    clearTimeout(resizeImage.timeout);
    resizeImage.timeout = setTimeout(async () => {
        try {
            showLoading();
            const resizedImageUrl = await createResizedImage(width, height);
            elements.previewImage.src = resizedImageUrl;
            state.originalImageData = resizedImageUrl;
            state.originalWidth = width;
            state.originalHeight = height;
            
            if (history) {
                history.push(resizedImageUrl, width, height);
            }
            
            showToast('Image resized successfully');
        } catch (error) {
            showToast('Error resizing image', 'error');
        } finally {
            hideLoading();
        }
    }, 300);
}

export { resizeImage }; 