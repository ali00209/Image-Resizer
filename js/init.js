// Prevent Flash of Unstyled Content (FOUC)
document.documentElement.style.visibility = 'hidden';
document.addEventListener('DOMContentLoaded', function() {
    document.documentElement.style.visibility = '';
});

// Initialize menu functionality
document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    const settingsPanels = document.querySelectorAll('.settings-panel');

    // Store active tab in localStorage
    function saveActiveTab(targetId) {
        localStorage.setItem('activeTab', targetId);
    }

    // Get active tab from localStorage
    function getActiveTab() {
        return localStorage.getItem('activeTab') || 'aspect-ratios';
    }

    function switchPanel(targetId) {
        // Hide all panels first
        document.querySelectorAll('.settings-panel').forEach(panel => {
            panel.style.display = 'none';
            panel.setAttribute('aria-hidden', 'true');
            
            // Find corresponding menu item and update its state
            const menuItem = document.querySelector(`[data-target="${panel.id}"]`);
            if (menuItem) {
                menuItem.classList.remove('active');
                menuItem.setAttribute('aria-selected', 'false');
            }
        });
        
        // Show target panel and update its menu item
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) {
            targetPanel.style.display = 'block';
            targetPanel.setAttribute('aria-hidden', 'false');
            
            const activeMenuItem = document.querySelector(`[data-target="${targetId}"]`);
            if (activeMenuItem) {
                activeMenuItem.classList.add('active');
                activeMenuItem.setAttribute('aria-selected', 'true');
            }
        }

        // Save active tab
        saveActiveTab(targetId);
    }

    // Add click handlers to menu items
    function setupMenuItems() {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = item.dataset.target;
                switchPanel(targetId);
            });
        });
    }

    // Initial setup
    setupMenuItems();

    // Show last active panel or default to aspect-ratios
    switchPanel(getActiveTab());

    // Handle new panels added dynamically
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach((node) => {
                    if (node.classList && node.classList.contains('settings-panel')) {
                        // Hide newly added panel initially
                        node.style.display = 'none';
                        node.setAttribute('aria-hidden', 'true');
                    }
                });
            }
            
            // Re-setup menu items when new ones are added
            if (mutation.type === 'childList' && 
                mutation.target.classList.contains('menu-section')) {
                setupMenuItems();
                
                // If this is the active panel, show it
                const activeTab = getActiveTab();
                if (activeTab === mutation.addedNodes[0]?.dataset?.target) {
                    switchPanel(activeTab);
                }
            }
        });
    });

    // Start observing both settings content and menu section
    const settingsContent = document.querySelector('.settings-content');
    const menuSection = document.querySelector('.menu-section');
    
    observer.observe(settingsContent, { 
        childList: true,
        subtree: true 
    });
    observer.observe(menuSection, { 
        childList: true,
        subtree: true 
    });
}); 