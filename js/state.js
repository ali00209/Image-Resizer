// DOM Elements
export const elements = {
    imageInput: document.getElementById('imageInput'),
    previewImage: document.getElementById('previewImage'),
    dropText: document.getElementById('dropText'),
    widthInput: document.getElementById('widthInput'),
    heightInput: document.getElementById('heightInput'),
    downloadBtn: document.getElementById('downloadBtn'),
    preview: document.querySelector('.preview'),
    lockAspectRatio: document.getElementById('lockAspectRatio'),
    themeToggle: document.getElementById('themeToggle'),
    originalBtn: document.getElementById('originalBtn')
};

// Shared state
export const state = {
    originalWidth: 0,
    originalHeight: 0,
    initialWidth: 0,
    initialHeight: 0,
    originalImageData: null,
    initialImageData: null,
    isLocked: true,
    isDarkTheme: false
}; 