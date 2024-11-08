function initializeSidebar() {
    // Create menu toggle button
    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '<i class="ph ph-list"></i>';
    menuToggle.setAttribute('aria-label', 'Toggle menu');
    document.body.appendChild(menuToggle);

    // Create sidebar close button
    const sidebarClose = document.createElement('button');
    sidebarClose.className = 'sidebar-close';
    sidebarClose.innerHTML = '<i class="ph ph-x"></i>';
    sidebarClose.setAttribute('aria-label', 'Close menu');
    document.querySelector('.sidebar-header').appendChild(sidebarClose);

    // Create sidebar overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    const sidebar = document.querySelector('.sidebar');

    // Toggle sidebar
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        menuToggle.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    }

    // Close sidebar
    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        menuToggle.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Event listeners
    menuToggle.addEventListener('click', toggleSidebar);
    sidebarClose.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });

    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (window.innerWidth > 1024) {
                closeSidebar();
            }
        }, 100);
    });
}

export { initializeSidebar }; 