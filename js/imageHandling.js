import { showLoading, hideLoading, showToast } from './utils.js';
import { validateImage, validateDimensions } from './validation.js';
import { elements, state } from './state.js';
import { updatePreviewOverlay } from './preview.js';
import { history } from './history.js';
import { updateHandlesVisibility } from './resizeHandles.js';

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsDataURL(file);
    });
}

function getImageDimensions(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Error loading image'));
        img.src = url;
    });
}

async function createResizedImage(width, height, sourceImage = null) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
        }
        
        const img = new Image();
        img.onload = function() {
            // Create a temporary canvas for high-quality resizing
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            // Set the temp canvas to the current image size
            tempCanvas.width = img.naturalWidth;
            tempCanvas.height = img.naturalHeight;
            
            // Draw the current image at full size
            tempCtx.imageSmoothingEnabled = true;
            tempCtx.imageSmoothingQuality = 'high';
            tempCtx.drawImage(img, 0, 0);
            
            // Set final canvas size
            canvas.width = width;
            canvas.height = height;
            
            // Enable high-quality image scaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Use step-down algorithm for better quality when downsizing
            if (width < img.naturalWidth || height < img.naturalHeight) {
                let currentWidth = img.naturalWidth;
                let currentHeight = img.naturalHeight;
                let currentCanvas = tempCanvas;
                
                // Step down by halves until close to target size
                while (currentWidth > width * 2 || currentHeight > height * 2) {
                    const nextWidth = Math.max(width, Math.floor(currentWidth / 2));
                    const nextHeight = Math.max(height, Math.floor(currentHeight / 2));
                    
                    const nextCanvas = document.createElement('canvas');
                    nextCanvas.width = nextWidth;
                    nextCanvas.height = nextHeight;
                    
                    const nextCtx = nextCanvas.getContext('2d');
                    nextCtx.imageSmoothingEnabled = true;
                    nextCtx.imageSmoothingQuality = 'high';
                    nextCtx.drawImage(currentCanvas, 0, 0, nextWidth, nextHeight);
                    
                    currentWidth = nextWidth;
                    currentHeight = nextHeight;
                    currentCanvas = nextCanvas;
                }
                
                // Final resize to exact dimensions
                ctx.drawImage(currentCanvas, 0, 0, width, height);
            } else {
                // Direct resize for upscaling
                ctx.drawImage(img, 0, 0, width, height);
            }
            
            resolve(canvas.toDataURL('image/png', 1.0));
        };
        
        img.onerror = () => reject(new Error('Error loading image'));
        img.src = sourceImage || state.originalImageData;
    });
}

async function handleImage(file) {
    const errors = validateImage(file);
    if (errors.length > 0) {
        errors.forEach(error => showToast(error, 'error'));
        return;
    }

    showLoading();

    try {
        const imageUrl = await loadImage(file);
        const img = await getImageDimensions(imageUrl);
        
        if (img.naturalWidth > 8000 || img.naturalHeight > 8000) {
            throw new Error('Image dimensions too large (max 8000x8000)');
        }

        // Store initial dimensions and data (never changes after initial load)
        state.initialWidth = img.naturalWidth;
        state.initialHeight = img.naturalHeight;
        state.initialImageData = imageUrl;

        // Store current dimensions and data (changes with operations)
        state.originalWidth = img.naturalWidth;
        state.originalHeight = img.naturalHeight;
        state.originalImageData = imageUrl;
        
        elements.previewImage.src = imageUrl;
        elements.previewImage.style.display = 'block';
        elements.dropText.style.display = 'none';
        
        elements.widthInput.value = state.originalWidth;
        elements.heightInput.value = state.originalHeight;
        
        updatePreviewOverlay(state.originalWidth, state.originalHeight);
        updateHandlesVisibility(true); // Show resize handles when image is loaded
        
        if (history) {
            history.clear();
            history.push(imageUrl, img.naturalWidth, img.naturalHeight);
        }
        
        showToast('Image loaded successfully');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

export {
    loadImage,
    getImageDimensions,
    createResizedImage,
    handleImage
}; 