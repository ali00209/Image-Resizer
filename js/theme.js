import { elements, state } from './state.js';

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        state.isDarkTheme = savedTheme === 'dark';
        document.body.setAttribute('data-theme', savedTheme);
        updateThemeIcon();
    }
}

function toggleTheme() {
    state.isDarkTheme = !state.isDarkTheme;
    document.body.setAttribute('data-theme', state.isDarkTheme ? 'dark' : 'light');
    updateThemeIcon();
    localStorage.setItem('theme', state.isDarkTheme ? 'dark' : 'light');
}

function updateThemeIcon() {
    const themeIcon = elements.themeToggle.querySelector('i');
    themeIcon.className = state.isDarkTheme ? 'ph ph-moon' : 'ph ph-sun';
}

export {
    initializeTheme,
    toggleTheme,
    updateThemeIcon
}; 