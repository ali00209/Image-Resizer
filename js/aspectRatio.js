import { elements, state } from './state.js';
import { resizeImage } from './main.js';
import { showToast } from './utils.js';
import { checkImageLoaded } from './eventHandlers.js';
import { history } from './history.js';

function setupAspectRatios() {
    const ratioPresets = document.querySelectorAll('.ratio-preset');
    const customRatioWidth = document.getElementById('customRatioWidth');
    const customRatioHeight = document.getElementById('customRatioHeight');
    const applyCustomRatio = document.getElementById('applyCustomRatio');

    ratioPresets.forEach(preset => {
        preset.addEventListener('click', () => {
            if (!checkImageLoaded()) return;

            // Remove active class from all presets
            ratioPresets.forEach(p => {
                p.classList.remove('active');
                p.setAttribute('aria-pressed', 'false');
            });
            
            // Add active class to clicked preset
            preset.classList.add('active');
            preset.setAttribute('aria-pressed', 'true');

            const ratio = preset.dataset.ratio;
            const currentWidth = parseInt(elements.widthInput.value);
            const [rWidth, rHeight] = ratio.split(':').map(Number);
            const newHeight = Math.round((currentWidth * rHeight) / rWidth);

            elements.heightInput.value = newHeight;
            resizeImage(currentWidth, newHeight);
        });
    });

    // Handle custom ratio
    if (applyCustomRatio) {
        applyCustomRatio.addEventListener('click', () => {
            if (!checkImageLoaded()) return;

            const ratioWidth = parseInt(customRatioWidth.value);
            const ratioHeight = parseInt(customRatioHeight.value);

            if (!ratioWidth || !ratioHeight) {
                showToast('Please enter both width and height for the ratio', 'error');
                return;
            }

            if (ratioWidth <= 0 || ratioHeight <= 0) {
                showToast('Ratio values must be greater than 0', 'error');
                return;
            }

            // Remove active class from all presets
            ratioPresets.forEach(p => {
                p.classList.remove('active');
                p.setAttribute('aria-pressed', 'false');
            });

            const currentWidth = parseInt(elements.widthInput.value);
            const newHeight = Math.round((currentWidth * ratioHeight) / ratioWidth);

            elements.heightInput.value = newHeight;
            resizeImage(currentWidth, newHeight);
        });
    }

    // Add input validation for custom ratio inputs
    [customRatioWidth, customRatioHeight].forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                if (!checkImageLoaded()) {
                    input.value = '';
                    return;
                }
                let value = parseInt(input.value);
                if (value < 1) input.value = 1;
                if (value > 100) input.value = 100;
            });
        }
    });
}

export { setupAspectRatios }; 