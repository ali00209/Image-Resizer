import { elements, state } from './state.js';
import { updatePreviewOverlay } from './preview.js';
import { showToast } from './utils.js';
import { history } from './history.js';

let cropStartX = 0;
let cropStartY = 0;
let isCropping = false;
let cropBox = null;
let originalImageRect = null;

function initializeCropTool() {
    // Create crop overlay (hidden by default)
    const cropOverlay = document.createElement('div');
    cropOverlay.className = 'crop-overlay';
    cropOverlay.style.display = 'none';
    elements.preview.appendChild(cropOverlay);

    // Create crop box
    cropBox = document.createElement('div');
    cropBox.className = 'crop-box';
    cropBox.style.display = 'none';
    elements.preview.appendChild(cropBox);

    setupCropEvents();
}

function setupCropEvents() {
    const cropBtn = document.getElementById('cropBtn');
    const cropOverlay = document.querySelector('.crop-overlay');

    cropBtn.addEventListener('click', () => {
        if (!state.originalImageData) {
            showToast('Please load an image first', 'error');
            return;
        }
        toggleCropMode();
    });

    elements.preview.addEventListener('mousedown', startCrop);
    elements.preview.addEventListener('mousemove', updateCrop);
    elements.preview.addEventListener('mouseup', endCrop);
    elements.preview.addEventListener('touchstart', handleTouchStart);
    elements.preview.addEventListener('touchmove', handleTouchMove);
    elements.preview.addEventListener('touchend', handleTouchEnd);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && cropOverlay.style.display !== 'none') {
            cancelCrop();
        }
    });
}

function toggleCropMode() {
    const cropOverlay = document.querySelector('.crop-overlay');
    const cropBtn = document.getElementById('cropBtn');
    
    if (cropOverlay.style.display === 'none') {
        cropOverlay.style.display = 'block';
        cropBtn.classList.add('active');
        elements.preview.style.cursor = 'crosshair';
        originalImageRect = elements.previewImage.getBoundingClientRect();
    } else {
        exitCropMode();
    }
}

function exitCropMode() {
    const cropOverlay = document.querySelector('.crop-overlay');
    const cropBtn = document.getElementById('cropBtn');
    cropOverlay.style.display = 'none';
    cropBox.style.display = 'none';
    cropBtn.classList.remove('active');
    elements.preview.style.cursor = 'default';
    originalImageRect = null;
}

function cancelCrop() {
    isCropping = false;
    exitCropMode();
    showToast('Crop cancelled', 'error');
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    startCrop(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    updateCrop(mouseEvent);
}

function handleTouchEnd(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const mouseEvent = new MouseEvent('mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    endCrop(mouseEvent);
}

function startCrop(e) {
    if (document.querySelector('.crop-overlay').style.display === 'none') return;

    const rect = elements.preview.getBoundingClientRect();
    cropStartX = Math.max(originalImageRect.left - rect.left, Math.min(originalImageRect.right - rect.left, e.clientX - rect.left));
    cropStartY = Math.max(originalImageRect.top - rect.top, Math.min(originalImageRect.bottom - rect.top, e.clientY - rect.top));
    isCropping = true;

    cropBox.style.left = `${cropStartX}px`;
    cropBox.style.top = `${cropStartY}px`;
    cropBox.style.width = '0';
    cropBox.style.height = '0';
    cropBox.style.display = 'block';
}

function updateCrop(e) {
    if (!isCropping) return;

    const rect = elements.preview.getBoundingClientRect();
    const currentX = Math.max(originalImageRect.left - rect.left, Math.min(originalImageRect.right - rect.left, e.clientX - rect.left));
    const currentY = Math.max(originalImageRect.top - rect.top, Math.min(originalImageRect.bottom - rect.top, e.clientY - rect.top));

    const width = currentX - cropStartX;
    const height = currentY - cropStartY;

    cropBox.style.width = `${Math.abs(width)}px`;
    cropBox.style.height = `${Math.abs(height)}px`;
    cropBox.style.left = `${width < 0 ? currentX : cropStartX}px`;
    cropBox.style.top = `${height < 0 ? currentY : cropStartY}px`;

    updateCropDimensions(Math.abs(width), Math.abs(height));
}

function updateCropDimensions(width, height) {
    let dimensionLabel = cropBox.querySelector('.crop-dimensions');
    if (!dimensionLabel) {
        dimensionLabel = document.createElement('div');
        dimensionLabel.className = 'crop-dimensions';
        cropBox.appendChild(dimensionLabel);
    }

    const scaleX = elements.previewImage.naturalWidth / originalImageRect.width;
    const scaleY = elements.previewImage.naturalHeight / originalImageRect.height;
    const realWidth = Math.round(width * scaleX);
    const realHeight = Math.round(height * scaleY);

    dimensionLabel.textContent = `${realWidth}px × ${realHeight}px`;
}

function endCrop(e) {
    if (!isCropping) return;
    isCropping = false;

    const rect = elements.preview.getBoundingClientRect();
    const currentX = Math.max(originalImageRect.left - rect.left, Math.min(originalImageRect.right - rect.left, e.clientX - rect.left));
    const currentY = Math.max(originalImageRect.top - rect.top, Math.min(originalImageRect.bottom - rect.top, e.clientY - rect.top));

    const cropWidth = Math.abs(currentX - cropStartX);
    const cropHeight = Math.abs(currentY - cropStartY);

    if (cropWidth < 10 || cropHeight < 10) {
        showToast('Crop area too small (minimum 10px)', 'error');
        cropBox.style.display = 'none';
        return;
    }

    applyCrop();
}

function applyCrop() {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not available');

        const previewRect = elements.preview.getBoundingClientRect();
        const cropRect = cropBox.getBoundingClientRect();
        const imageRect = elements.previewImage.getBoundingClientRect();

        const scaleX = elements.previewImage.naturalWidth / imageRect.width;
        const scaleY = elements.previewImage.naturalHeight / imageRect.height;

        const cropX = Math.max(0, (cropRect.left - imageRect.left) * scaleX);
        const cropY = Math.max(0, (cropRect.top - imageRect.top) * scaleY);
        const cropWidth = Math.min(elements.previewImage.naturalWidth - cropX, cropRect.width * scaleX);
        const cropHeight = Math.min(elements.previewImage.naturalHeight - cropY, cropRect.height * scaleY);

        // Set canvas size to match crop dimensions
        canvas.width = cropWidth;
        canvas.height = cropHeight;

        // Enable high-quality image scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Create a temporary canvas for the original image
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // Draw the original image at full size
            tempCanvas.width = img.naturalWidth;
            tempCanvas.height = img.naturalHeight;
            tempCtx.drawImage(img, 0, 0);

            // Crop from the full-size image
            ctx.drawImage(
                tempCanvas,
                cropX, cropY, cropWidth, cropHeight,
                0, 0, cropWidth, cropHeight
            );

            const croppedImageUrl = canvas.toDataURL('image/png', 1.0);
            elements.previewImage.src = croppedImageUrl;
            state.originalImageData = croppedImageUrl;
            state.originalWidth = cropWidth;
            state.originalHeight = cropHeight;

            elements.widthInput.value = Math.round(cropWidth);
            elements.heightInput.value = Math.round(cropHeight);

            updatePreviewOverlay(cropWidth, cropHeight);

            if (history) {
                history.push(croppedImageUrl, cropWidth, cropHeight);
            }

            exitCropMode();
            showToast('Image cropped successfully');
        };

        img.src = state.initialImageData; // Use initial image data for best quality
    } catch (error) {
        console.error('Crop error:', error);
        showToast('Error cropping image', 'error');
        exitCropMode();
    }
}

export { initializeCropTool }; 