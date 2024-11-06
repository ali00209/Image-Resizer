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

function validateDimensions(width, height) {
    if (!width || !height) {
        showError('Please enter both width and height values');
        return false;
    }
    
    if (width <= 0 || height <= 0) {
        showError('Dimensions must be greater than 0');
        return false;
    }
    
    if (width > 8000 || height > 8000) {
        showError('Maximum dimension is 8000 pixels');
        return false;
    }
    
    return true;
}

const imageInput = document.getElementById('imageInput');
const previewImage = document.getElementById('previewImage');
const dropText = document.getElementById('dropText');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const resizeBtn = document.getElementById('resizeBtn');
const downloadBtn = document.getElementById('downloadBtn');
const preview = document.querySelector('.preview');
const lockAspectRatio = document.getElementById('lockAspectRatio');

let originalWidth = 0;
let originalHeight = 0;
let originalImageData = null;

imageInput.addEventListener('change', handleImageSelect);

preview.addEventListener('dragover', (e) => {
    e.preventDefault();
    preview.style.borderColor = '#4CAF50';
});

preview.addEventListener('dragleave', (e) => {
    e.preventDefault();
    preview.style.borderColor = '#ccc';
});

preview.addEventListener('drop', (e) => {
    e.preventDefault();
    preview.style.borderColor = '#ccc';
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleImage(file);
    }
});

function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleImage(file);
    }
}

function handleImage(file) {
    if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        showError('File size must be less than 10MB');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onerror = () => {
        showError('Error reading file');
    };
    
    reader.onload = function(e) {
        originalImageData = e.target.result;
        
        const img = new Image();
        img.onload = function() {
            if (img.width > 8000 || img.height > 8000) {
                showError('Image dimensions too large (max 8000x8000)');
                return;
            }
            
            previewImage.src = originalImageData;
            previewImage.style.display = 'block';
            dropText.style.display = 'none';
            
            originalWidth = img.naturalWidth;
            originalHeight = img.naturalHeight;
            
            widthInput.value = originalWidth;
            heightInput.value = originalHeight;
            
            const customRatio = document.querySelector('.ratio-radio[data-ratio="custom"]');
            if (customRatio) customRatio.checked = true;
            
            lockAspectRatio.checked = true;
            
            showSuccess('Image loaded successfully');
            
            const originalRatio = document.querySelector('.ratio-radio[data-ratio="original"]');
            if (originalRatio) {
                originalRatio.checked = true;
            }
        };
        
        img.onerror = () => {
            showError('Invalid or corrupted image file');
        };
        
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

resizeBtn.addEventListener('click', () => {
    const width = parseInt(widthInput.value);
    const height = parseInt(heightInput.value);
    
    if (width && height) {
        resizeImage(width, height);
    }
});

function resizeImage(width, height) {
    if (!validateDimensions(width, height)) return;
    
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            showError('Canvas context not available');
            return;
        }
        
        const img = new Image();
        img.onload = function() {
            canvas.width = width;
            canvas.height = height;
            
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            if (width < originalWidth || height < originalHeight) {
                let currentWidth = originalWidth;
                let currentHeight = originalHeight;
                let tempCanvas = document.createElement('canvas');
                let tempCtx = tempCanvas.getContext('2d');
                let currentImage = img;
                
                while (currentWidth > width * 2 || currentHeight > height * 2) {
                    currentWidth = Math.floor(currentWidth / 2);
                    currentHeight = Math.floor(currentHeight / 2);
                    
                    tempCanvas.width = currentWidth;
                    tempCanvas.height = currentHeight;
                    
                    tempCtx.imageSmoothingEnabled = true;
                    tempCtx.imageSmoothingQuality = 'high';
                    tempCtx.drawImage(currentImage, 0, 0, currentWidth, currentHeight);
                    
                    const tempImage = new Image();
                    tempImage.src = tempCanvas.toDataURL('image/png', 1.0);
                    currentImage = tempImage;
                }
                
                ctx.drawImage(currentImage, 0, 0, width, height);
            } else {
                ctx.drawImage(img, 0, 0, width, height);
            }
            
            previewImage.src = canvas.toDataURL('image/png', 1.0);
            showSuccess('Image resized successfully');
        };
        
        img.src = originalImageData;
        
    } catch (error) {
        console.error('Resize error:', error);
        showError('Error resizing image');
    }
}

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'resized-image.png';
    link.href = previewImage.src;
    link.click();
});

function handleWidthChange() {
    if (!lockAspectRatio.checked) return;
    
    const width = parseInt(widthInput.value);
    if (width && originalWidth && originalHeight) {
        const ratio = originalHeight / originalWidth;
        const newHeight = Math.round(width * ratio);
        heightInput.value = newHeight;
    }
}

function handleHeightChange() {
    if (!lockAspectRatio.checked) return;
    
    const height = parseInt(heightInput.value);
    if (height && originalWidth && originalHeight) {
        const ratio = originalWidth / originalHeight;
        const newWidth = Math.round(height * ratio);
        widthInput.value = newWidth;
    }
}

widthInput.removeEventListener('input', handleWidthChange);
heightInput.removeEventListener('input', handleHeightChange);

widthInput.addEventListener('input', debounce(() => {
    const width = parseInt(widthInput.value);
    if (width > 8000) {
        widthInput.value = 8000;
    }
    
    if (isLocked && originalWidth && originalHeight) {
        const currentWidth = parseInt(widthInput.value);
        const ratio = originalHeight / originalWidth;
        const newHeight = Math.round(currentWidth * ratio);
        heightInput.value = newHeight;
    }
    
    resizeImage(width, parseInt(heightInput.value));
}, 300));

heightInput.addEventListener('input', debounce(() => {
    const height = parseInt(heightInput.value);
    if (height > 8000) {
        heightInput.value = 8000;
    }
    
    if (isLocked && originalWidth && originalHeight) {
        const currentHeight = parseInt(heightInput.value);
        const ratio = originalWidth / originalHeight;
        const newWidth = Math.round(currentHeight * ratio);
        widthInput.value = newWidth;
    }
    
    resizeImage(parseInt(widthInput.value), height);
}, 300));

async function createResizedImage(width, height) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
        }
        
        const img = new Image();
        img.onload = function() {
            canvas.width = width;
            canvas.height = height;
            
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            if (width < originalWidth || height < originalHeight) {
                let currentWidth = originalWidth;
                let currentHeight = originalHeight;
                let tempCanvas = document.createElement('canvas');
                let tempCtx = tempCanvas.getContext('2d');
                let currentImage = img;
                
                while (currentWidth > width * 2 || currentHeight > height * 2) {
                    currentWidth = Math.floor(currentWidth / 2);
                    currentHeight = Math.floor(currentHeight / 2);
                    
                    tempCanvas.width = currentWidth;
                    tempCanvas.height = currentHeight;
                    
                    tempCtx.imageSmoothingEnabled = true;
                    tempCtx.imageSmoothingQuality = 'high';
                    tempCtx.drawImage(currentImage, 0, 0, currentWidth, currentHeight);
                    
                    const tempImage = new Image();
                    tempImage.src = tempCanvas.toDataURL('image/png', 1.0);
                    currentImage = tempImage;
                }
                
                ctx.drawImage(currentImage, 0, 0, width, height);
            } else {
                ctx.drawImage(img, 0, 0, width, height);
            }
            
            resolve(canvas.toDataURL('image/png', 1.0));
        };
        
        img.onerror = () => reject(new Error('Error loading image'));
        img.src = originalImageData;
    });
}

function downloadImage(dataUrl, fileName) {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();
}

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

async function downloadMultipleSizes() {
    const mainContent = document.querySelector('.main-content');
    const checkboxes = document.querySelectorAll('#common-sizes .size-checkbox:checked');
    
    if (checkboxes.length === 0) {
        alert('Please select at least one size to download');
        return;
    }
    
    mainContent.classList.add('loading');
    
    try {
        const zip = new JSZip();
        
        const imgFolder = zip.folder("resized-images");
        
        for (const checkbox of checkboxes) {
            const width = parseInt(checkbox.dataset.width);
            const height = parseInt(checkbox.dataset.height);
            const resizedImage = await createResizedImage(width, height);
            
            const imageBlob = dataURLtoBlob(resizedImage);
            
            imgFolder.file(`resized-${width}x${height}.png`, imageBlob);
        }
        
        const zipContent = await zip.generateAsync({ type: "blob" });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipContent);
        link.download = 'resized-images.zip';
        link.click();
        
        URL.revokeObjectURL(link.href);
        showSuccess('Images downloaded successfully');
        
    } catch (error) {
        console.error('Error processing images:', error);
        showError('There was an error processing the images');
    } finally {
        mainContent.classList.remove('loading');
    }
}

const downloadAllBtn = document.getElementById('downloadAllBtn');
downloadAllBtn.addEventListener('click', downloadMultipleSizes);

function updateCustomInputs(checkbox) {
    if (checkbox.checked) {
        widthInput.value = checkbox.dataset.width;
        heightInput.value = checkbox.dataset.height;
    }
}

document.querySelectorAll('.size-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', () => updateCustomInputs(checkbox));
});

async function downloadIcons() {
    const mainContent = document.querySelector('.main-content');
    const checkboxes = document.querySelectorAll('#icon-sizes .size-checkbox:checked');
    
    if (checkboxes.length === 0) {
        alert('Please select at least one icon size to download');
        return;
    }
    
    mainContent.classList.add('loading');
    
    try {
        const zip = new JSZip();
        
        const iosFolder = zip.folder("ios-icons");
        const androidFolder = zip.folder("android-icons");
        const faviconFolder = zip.folder("favicons");
        
        for (const checkbox of checkboxes) {
            const width = parseInt(checkbox.dataset.width);
            const height = parseInt(checkbox.dataset.height);
            const resizedImage = await createResizedImage(width, height);
            const imageBlob = dataURLtoBlob(resizedImage);
            
            const category = checkbox.closest('.size-category').querySelector('h4').textContent;
            let targetFolder;
            let fileName;
            
            if (category.includes('iOS')) {
                targetFolder = iosFolder;
                fileName = `ios-icon-${width}x${height}.png`;
            } else if (category.includes('Android')) {
                targetFolder = androidFolder;
                fileName = `android-icon-${width}x${height}.png`;
            } else {
                targetFolder = faviconFolder;
                fileName = width <= 64 ? `favicon-${width}x${height}.png` : `web-icon-${width}x${height}.png`;
            }
            
            targetFolder.file(fileName, imageBlob);
        }
        
        const zipContent = await zip.generateAsync({ type: "blob" });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipContent);
        link.download = 'icon-package.zip';
        link.click();
        
        URL.revokeObjectURL(link.href);
        showSuccess('Icons downloaded successfully');
        
    } catch (error) {
        console.error('Error processing icons:', error);
        showError('There was an error processing the icons');
    } finally {
        mainContent.classList.remove('loading');
    }
}

const downloadIconsBtn = document.getElementById('downloadIconsBtn');
downloadIconsBtn.addEventListener('click', downloadIcons);

document.querySelectorAll('.size-category').forEach(category => {
    const checkboxes = category.querySelectorAll('.size-checkbox');
    const categoryName = category.querySelector('h4').textContent;
    
    const selectAllBtn = document.createElement('button');
    selectAllBtn.textContent = 'Select All';
    selectAllBtn.className = 'select-all-btn';
    selectAllBtn.style.fontSize = '0.8em';
    selectAllBtn.style.padding = '4px 8px';
    selectAllBtn.style.marginLeft = '10px';
    
    category.querySelector('h4').appendChild(selectAllBtn);
    
    selectAllBtn.addEventListener('click', () => {
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
    });
});

function applyAspectRatio(ratio) {
    if (!ratio || ratio === 'custom' || !originalWidth || !originalHeight) return;
    
    const [width, height] = ratio.split(':').map(Number);
    const currentWidth = parseInt(widthInput.value);
    
    if (currentWidth) {
        const newHeight = Math.round((currentWidth * height) / width);
        heightInput.value = newHeight;
        
        resizeImage(currentWidth, newHeight);
    }
}

function handleAspectRatioChange(e) {
    const radio = e.target;
    if (!radio.checked) return;
    
    if (radio.dataset.ratio === 'original') {
        widthInput.value = originalWidth;
        heightInput.value = originalHeight;
        lockAspectRatio.checked = true;
        resizeImage(originalWidth, originalHeight);
        return;
    }
    
    lockAspectRatio.checked = true;
    
    const currentWidth = parseInt(widthInput.value);
    const [ratioWidth, ratioHeight] = radio.dataset.ratio.split(':').map(Number);
    const newHeight = Math.round((currentWidth * ratioHeight) / ratioWidth);
    
    heightInput.value = newHeight;
    
    resizeImage(currentWidth, newHeight);
}

document.querySelectorAll('.ratio-radio').forEach(radio => {
    radio.addEventListener('change', handleAspectRatioChange);
});

widthInput.addEventListener('input', debounce(() => {
    const width = parseInt(widthInput.value);
    if (width > 8000) {
        widthInput.value = 8000;
    }
    if (lockAspectRatio.checked) {
        const selectedRatio = document.querySelector('.ratio-radio:checked');
        if (selectedRatio && selectedRatio.dataset.ratio !== 'custom') {
            applyAspectRatio(selectedRatio.dataset.ratio);
        } else {
            handleWidthChange();
            resizeImage(width, parseInt(heightInput.value));
        }
    }
}, 300));

heightInput.addEventListener('input', debounce(() => {
    const height = parseInt(heightInput.value);
    if (height > 8000) {
        heightInput.value = 8000;
    }
    if (lockAspectRatio.checked) {
        handleHeightChange();
        resizeImage(parseInt(widthInput.value), height);
    }
}, 300));

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

// Move these variable declarations to the top level
const customRatioWidth = document.getElementById('customRatioWidth');
const customRatioHeight = document.getElementById('customRatioHeight');
const applyCustomRatio = document.getElementById('applyCustomRatio');
const ratioPresets = document.querySelectorAll('.ratio-preset');

// Add these at the top level with other DOM element declarations
const themeToggle = document.getElementById('themeToggle');
const lockButton = document.getElementById('lockAspectRatio');
let isLocked = true;
let isDarkTheme = false;

// Theme toggle functionality
function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    document.body.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
    const themeIcon = themeToggle.querySelector('i');
    themeIcon.className = isDarkTheme ? 'ph ph-moon' : 'ph ph-sun';
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
}

// Initialize theme from saved preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    isDarkTheme = savedTheme === 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    const themeIcon = themeToggle.querySelector('i');
    themeIcon.className = isDarkTheme ? 'ph ph-moon' : 'ph ph-sun';
}

// Add theme toggle event listener
themeToggle.addEventListener('click', toggleTheme);

// Lock button functionality
lockButton.innerHTML = '<i class="ph ph-lock"></i>';
lockButton.classList.toggle('locked', isLocked);

lockButton.addEventListener('click', () => {
    isLocked = !isLocked;
    const lockIcon = lockButton.querySelector('i');
    lockIcon.className = isLocked ? 'ph ph-lock' : 'ph ph-lock-open';
    lockButton.classList.toggle('locked', isLocked);
    
    if (isLocked && originalWidth && originalHeight) {
        const currentWidth = parseInt(widthInput.value);
        const ratio = originalHeight / originalWidth;
        const newHeight = Math.round(currentWidth * ratio);
        heightInput.value = newHeight;
    }
});

// Update aspect ratio handling
ratioPresets.forEach(preset => {
    preset.addEventListener('click', () => {
        // Remove active class from all presets
        ratioPresets.forEach(p => p.classList.remove('active'));
        // Add active class to clicked preset
        preset.classList.add('active');

        const ratio = preset.dataset.ratio;
        if (ratio === 'original') {
            widthInput.value = originalWidth;
            heightInput.value = originalHeight;
            resizeImage(originalWidth, originalHeight);
        } else {
            const [rWidth, rHeight] = ratio.split(':').map(Number);
            const currentWidth = parseInt(widthInput.value);
            const newHeight = Math.round((currentWidth * rHeight) / rWidth);
            heightInput.value = newHeight;
            resizeImage(currentWidth, newHeight);
        }
    });
});

// Update width/height input handlers
widthInput.addEventListener('input', debounce(() => {
    const width = parseInt(widthInput.value);
    if (width > 8000) {
        widthInput.value = 8000;
    }
    if (isLocked) {
        const currentWidth = parseInt(widthInput.value);
        const ratio = originalHeight / originalWidth;
        const newHeight = Math.round(currentWidth * ratio);
        heightInput.value = newHeight;
    }
}, 300));

heightInput.addEventListener('input', debounce(() => {
    const height = parseInt(heightInput.value);
    if (height > 8000) {
        heightInput.value = 8000;
    }
    if (isLocked) {
        const currentHeight = parseInt(heightInput.value);
        const ratio = originalWidth / originalHeight;
        const newWidth = Math.round(currentHeight * ratio);
        widthInput.value = newWidth;
    }
}, 300));

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const menuItems = document.querySelectorAll('.menu-item');
    const settingsPanels = document.querySelectorAll('.settings-panel');

    function switchPanel(targetId) {
        settingsPanels.forEach(panel => {
            panel.style.display = 'none';
        });
        
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) {
            targetPanel.style.display = 'block';
        }
        
        menuItems.forEach(item => {
            if (item.dataset.target === targetId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.dataset.target;
            switchPanel(targetId);
            
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('active');
            }
        });
    });

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
        });
    }

    // Show initial panel
    switchPanel('resize-options');

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024 && 
            !sidebar.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    // Show/hide custom ratio inputs
    document.querySelectorAll('.ratio-radio').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.dataset.ratio === 'custom') {
                customRatioInputs.style.display = 'block';
            } else {
                customRatioInputs.style.display = 'none';
            }
        });
    });

    // Handle custom ratio application
    applyCustomRatio.addEventListener('click', () => {
        const ratioWidth = parseInt(customRatioWidth.value);
        const ratioHeight = parseInt(customRatioHeight.value);

        if (!ratioWidth || !ratioHeight) {
            showError('Please enter both width and height for custom ratio');
            return;
        }

        if (ratioWidth <= 0 || ratioHeight <= 0) {
            showError('Ratio values must be greater than 0');
            return;
        }

        // Calculate new dimensions maintaining the custom ratio
        const currentWidth = parseInt(widthInput.value);
        const newHeight = Math.round((currentWidth * ratioHeight) / ratioWidth);
        
        // Update height input and resize image
        heightInput.value = newHeight;
        lockAspectRatio.checked = true;
        resizeImage(currentWidth, newHeight);
    });

    // Add input validation
    [customRatioWidth, customRatioHeight].forEach(input => {
        input.addEventListener('input', () => {
            const value = parseInt(input.value);
            if (value < 0) input.value = 1;
            if (value > 100) input.value = 100;
        });
    });

    // Add these functions for the lock button and theme toggle

    // Update the lock aspect ratio functionality
    const lockButton = document.getElementById('lockAspectRatio');
    let isLocked = true;

    lockButton.innerHTML = '<i class="ph ph-lock"></i>';
    lockButton.classList.add('locked'); // Set initial state

    // Single event listener for lock button
    lockButton.addEventListener('click', () => {
        isLocked = !isLocked;
        const lockIcon = lockButton.querySelector('i');
        lockIcon.className = isLocked ? 'ph ph-lock' : 'ph ph-lock-open';
        lockButton.classList.toggle('locked', isLocked);
    });

    // Update width input handler
    widthInput.addEventListener('input', debounce(() => {
        const width = parseInt(widthInput.value);
        if (width > 8000) {
            widthInput.value = 8000;
        }
        if (isLocked && originalWidth && originalHeight) {
            const currentWidth = parseInt(widthInput.value);
            const ratio = originalHeight / originalWidth;
            const newHeight = Math.round(currentWidth * ratio);
            heightInput.value = newHeight;
            resizeImage(currentWidth, newHeight);
        }
    }, 300));

    // Update height input handler
    heightInput.addEventListener('input', debounce(() => {
        const height = parseInt(heightInput.value);
        if (height > 8000) {
            heightInput.value = 8000;
        }
        if (isLocked && originalWidth && originalHeight) {
            const currentHeight = parseInt(heightInput.value);
            const ratio = originalWidth / originalHeight;
            const newWidth = Math.round(currentHeight * ratio);
            widthInput.value = newWidth;
            resizeImage(newWidth, currentHeight);
        }
    }, 300));

    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    let isDarkTheme = false;

    function toggleTheme() {
        isDarkTheme = !isDarkTheme;
        document.body.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
        
        // Update theme icon
        const themeIcon = themeToggle.querySelector('i');
        themeIcon.className = isDarkTheme ? 'ph ph-moon' : 'ph ph-sun';
        
        localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    }

    // Initialize theme from saved preference
    document.addEventListener('DOMContentLoaded', () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            isDarkTheme = savedTheme === 'dark';
            document.body.setAttribute('data-theme', savedTheme);
            const themeIcon = themeToggle.querySelector('i');
            themeIcon.className = isDarkTheme ? 'ph ph-moon' : 'ph ph-sun';
        }
    });

    themeToggle.addEventListener('click', toggleTheme);

    // Handle custom ratio application
    if (applyCustomRatio) {
        applyCustomRatio.addEventListener('click', () => {
            const ratioWidth = parseInt(customRatioWidth.value);
            const ratioHeight = parseInt(customRatioHeight.value);

            if (!ratioWidth || !ratioHeight) {
                showError('Please enter both width and height for the ratio');
                return;
            }

            if (ratioWidth <= 0 || ratioHeight <= 0) {
                showError('Ratio values must be greater than 0');
                return;
            }

            // Remove active class from all presets
            ratioPresets.forEach(p => p.classList.remove('active'));

            const currentWidth = parseInt(widthInput.value);
            const newHeight = Math.round((currentWidth * ratioHeight) / ratioWidth);
            heightInput.value = newHeight;
            resizeImage(currentWidth, newHeight);
        });
    }

    // Input validation
    [customRatioWidth, customRatioHeight].forEach(input => {
        input.addEventListener('input', () => {
            let value = parseInt(input.value);
            if (value < 1) input.value = 1;
            if (value > 100) input.value = 100;
        });
    });
});

// Add this to prevent FOUC (Flash of Unstyled Content)
document.documentElement.style.visibility = 'hidden';
document.addEventListener('DOMContentLoaded', function() {
    document.documentElement.style.visibility = '';
});

// Add these utility functions at the top
function showLoading() {
    const mainContent = document.querySelector('.main-content');
    mainContent.classList.add('loading');
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-text">Processing...</div>
    `;
    mainContent.appendChild(loadingOverlay);
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
        <i class="ph ${type === 'success' ? 'ph-check-circle' : 'ph-x-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove toast after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add validation functions
function validateImage(file) {
    const errors = [];
    
    if (!file) {
        errors.push('Please select an image file');
        return errors;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
        errors.push('Selected file must be an image');
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
        errors.push('Image size must be less than 10MB');
    }

    return errors;
}

function validateDimensions(width, height) {
    const errors = [];
    
    if (!width || !height) {
        errors.push('Both width and height are required');
        return errors;
    }

    if (width <= 0 || height <= 0) {
        errors.push('Dimensions must be greater than 0');
    }

    if (width > 8000 || height > 8000) {
        errors.push('Maximum dimension is 8000 pixels');
    }

    return errors;
}

// Update the handleImage function
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

        previewImage.src = imageUrl;
        previewImage.style.display = 'block';
        dropText.style.display = 'none';
        
        originalWidth = img.naturalWidth;
        originalHeight = img.naturalHeight;
        originalImageData = imageUrl;
        
        widthInput.value = originalWidth;
        heightInput.value = originalHeight;
        
        showToast('Image loaded successfully');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Helper functions for image handling
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

// Update the resizeImage function
async function resizeImage(width, height) {
    const errors = validateDimensions(width, height);
    if (errors.length > 0) {
        errors.forEach(error => showToast(error, 'error'));
        return;
    }

    showLoading();

    try {
        const resizedImageUrl = await createResizedImage(width, height);
        previewImage.src = resizedImageUrl;
        showToast('Image resized successfully');
    } catch (error) {
        showToast('Error resizing image', 'error');
        console.error('Resize error:', error);
    } finally {
        hideLoading();
    }
}

// Add error boundary
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showToast('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showToast('An unexpected error occurred', 'error');
});

// Add these styles to your CSS file