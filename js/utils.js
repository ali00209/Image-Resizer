import { announce } from './accessibility.js';

// Utility functions
/**
 * Creates a debounced version of a function that delays its execution
 * until after a specified wait time has elapsed since the last call
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to wait
 * @returns {Function} - The debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.firstChild);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(successDiv, container.firstChild);
    
    setTimeout(() => successDiv.remove(), 3000);
}

function showLoading() {
    const mainContent = document.querySelector('.main-content');
    mainContent.classList.add('loading');
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.setAttribute('role', 'progressbar');
    loadingOverlay.setAttribute('aria-label', 'Processing image');
    loadingOverlay.innerHTML = `
        <div class="loading-spinner" aria-hidden="true"></div>
        <div class="loading-text">Processing...</div>
    `;
    mainContent.appendChild(loadingOverlay);
    announce('Processing image, please wait...');
}

function hideLoading() {
    const mainContent = document.querySelector('.main-content');
    mainContent.classList.remove('loading');
    const loadingOverlay = mainContent.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="ph ${type === 'success' ? 'ph-check-circle' : 'ph-x-circle'}" 
           aria-hidden="true"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    announce(message);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

const ErrorTypes = {
    IMAGE_PROCESSING: 'image_processing',
    NETWORK: 'network',
    VALIDATION: 'validation'
};

function handleError(error, type) {
    console.error(`[${type}]`, error);
    
    const userMessages = {
        [ErrorTypes.IMAGE_PROCESSING]: 'Unable to process image. Please try a different image.',
        [ErrorTypes.NETWORK]: 'Network error. Please check your connection.',
        [ErrorTypes.VALIDATION]: 'Invalid input. Please check your settings.'
    };
    
    showToast(userMessages[type] || 'An unexpected error occurred', 'error');
    hideLoading();
}

export {
    debounce,
    showError,
    showSuccess,
    showLoading,
    hideLoading,
    showToast,
    handleError
}; 