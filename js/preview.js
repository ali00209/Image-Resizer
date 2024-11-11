import { elements } from './state.js';
import { debounce } from './utils.js';

function createPreviewOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'preview-overlay';
    overlay.innerHTML = `
        <div class="grid-lines horizontal"></div>
        <div class="grid-lines vertical"></div>
        <div class="dimension-label"></div>
        <div class="ratio-label"></div>
    `;
    return overlay;
}

function updatePreviewOverlay(width, height) {
    const overlay = document.querySelector('.preview-overlay');
    const dimensionLabel = overlay.querySelector('.dimension-label');
    const ratioLabel = overlay.querySelector('.ratio-label');
    
    dimensionLabel.textContent = `${width}px × ${height}px`;
    
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    const ratioWidth = width / divisor;
    const ratioHeight = height / divisor;
    ratioLabel.textContent = `${ratioWidth}:${ratioHeight}`;
    
    updateGridLines(width, height);
}

function updateGridLines(width, height) {
    const horizontal = document.querySelector('.grid-lines.horizontal');
    const vertical = document.querySelector('.grid-lines.vertical');
    
    horizontal.innerHTML = '';
    vertical.innerHTML = '';
    
    const hCount = 3;
    const vCount = 3;
    
    for (let i = 1; i < hCount; i++) {
        const line = document.createElement('div');
        line.className = 'grid-line';
        line.style.top = `${(i * 100) / hCount}%`;
        horizontal.appendChild(line);
    }
    
    for (let i = 1; i < vCount; i++) {
        const line = document.createElement('div');
        line.className = 'grid-line';
        line.style.left = `${(i * 100) / vCount}%`;
        vertical.appendChild(line);
    }
}

function initializePreview() {
    const preview = elements.preview;
    const overlay = createPreviewOverlay();
    preview.appendChild(overlay);
}

const previewDebounce = debounce((width, height) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;
    
    if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium'; // Use medium quality for previews
        // ... drawing logic
    }
}, 100);

export {
    createPreviewOverlay,
    updatePreviewOverlay,
    updateGridLines,
    initializePreview,
    previewDebounce
}; 