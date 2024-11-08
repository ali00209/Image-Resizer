import { createResizedImage } from './imageHandling.js';
import { showLoading, hideLoading, showToast } from './utils.js';
import { elements, state } from './state.js';

function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

async function downloadMultipleSizes(type = 'single') {
    if (!state.originalImageData || elements.previewImage.src === '') {
        showToast('Please load an image first', 'error');
        return;
    }

    if (type === 'single') {
        const link = document.createElement('a');
        link.download = 'resized-image.png';
        link.href = elements.previewImage.src;
        link.click();
        return;
    }

    showLoading();

    try {
        const zip = new JSZip();
        let totalFiles = 0;

        // Handle common sizes if needed
        if (type === 'common' || type === 'both') {
            const commonSizes = document.querySelectorAll('#common-sizes .size-checkbox:checked');
            if (commonSizes.length > 0) {
                const commonFolder = zip.folder("resized-images");
                for (const checkbox of commonSizes) {
                    const width = parseInt(checkbox.dataset.width);
                    const height = parseInt(checkbox.dataset.height);
                    const resizedImage = await createResizedImage(width, height);
                    const imageBlob = dataURLtoBlob(resizedImage);
                    commonFolder.file(`resized-${width}x${height}.png`, imageBlob);
                    totalFiles++;
                }
            }
        }

        // Handle icon sizes if needed
        if (type === 'icons' || type === 'both') {
            const iconSizes = document.querySelectorAll('#icon-sizes .size-checkbox:checked');
            if (iconSizes.length > 0) {
                const iconFolder = zip.folder("icons");
                const iosFolder = iconFolder.folder('ios');
                const androidFolder = iconFolder.folder('android');
                const faviconFolder = iconFolder.folder('favicon');

                for (const checkbox of iconSizes) {
                    const width = parseInt(checkbox.dataset.width);
                    const height = parseInt(checkbox.dataset.height);
                    const resizedImage = await createResizedImage(width, height);
                    const imageBlob = dataURLtoBlob(resizedImage);
                    
                    const category = checkbox.closest('.size-category').querySelector('h4').textContent;
                    if (category.includes('iOS')) {
                        iosFolder.file(`ios-icon-${width}x${height}.png`, imageBlob);
                    } else if (category.includes('Android')) {
                        androidFolder.file(`android-icon-${width}x${height}.png`, imageBlob);
                    } else {
                        faviconFolder.file(width <= 64 ? `favicon-${width}x${height}.png` : `web-icon-${width}x${height}.png`, imageBlob);
                    }
                    totalFiles++;
                }
            }
        }

        if (totalFiles === 0) {
            showToast('Please select at least one size to download', 'error');
            return;
        }

        const zipContent = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipContent);
        link.download = type === 'both' ? 'image-package.zip' : (type === 'common' ? 'resized-images.zip' : 'icon-package.zip');
        link.click();
        
        URL.revokeObjectURL(link.href);
        showToast(`${totalFiles} images downloaded successfully`);
        
    } catch (error) {
        console.error('Error processing images:', error);
        showToast('There was an error processing the images', 'error');
    } finally {
        hideLoading();
    }
}

export { downloadMultipleSizes }; 