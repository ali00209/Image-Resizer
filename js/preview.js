import { elements } from './state.js';

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

export {
    createPreviewOverlay,
    updatePreviewOverlay,
    updateGridLines,
    initializePreview
}; 