function validateImage(file) {
    const errors = [];
    
    if (!file) {
        errors.push('Please select an image file');
        return errors;
    }

    if (!file.type.startsWith('image/')) {
        errors.push('Selected file must be an image');
    }

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

export {
    validateImage,
    validateDimensions
}; 