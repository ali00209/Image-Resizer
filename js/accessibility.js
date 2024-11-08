// Live region for screen reader announcements
let announcer;

function initializeAccessibility() {
    // Initialize live region
    announcer = document.getElementById('announcements');
    if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'announcements';
        announcer.className = 'sr-only';
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', 'polite');
        document.body.appendChild(announcer);
    }

    // Add keyboard navigation for tabs
    setupTabNavigation();
    
    // Add keyboard support for buttons
    setupButtonAccessibility();
}

function announce(message, type = 'status') {
    if (!announcer) return;
    
    announcer.textContent = ''; // Clear previous announcement
    // Force screen readers to announce new content
    setTimeout(() => {
        announcer.textContent = message;
    }, 50);
}

function setupTabNavigation() {
    const tabList = document.querySelector('[role="tablist"]');
    if (!tabList) return;

    const tabs = tabList.querySelectorAll('[role="tab"]');
    
    tabs.forEach(tab => {
        // Add keyboard navigation
        tab.addEventListener('keydown', (e) => {
            const targetTab = getTargetTab(e, tab, tabs);
            if (targetTab) {
                e.preventDefault();
                targetTab.focus();
                targetTab.click();
            }
        });

        // Update ARIA attributes on click
        tab.addEventListener('click', () => {
            updateTabAttributes(tab, tabs);
        });
    });
}

function getTargetTab(event, currentTab, tabs) {
    const tabArray = Array.from(tabs);
    const index = tabArray.indexOf(currentTab);
    
    let targetTab;
    switch (event.key) {
        case 'ArrowLeft':
            targetTab = tabArray[index - 1] || tabArray[tabArray.length - 1];
            break;
        case 'ArrowRight':
            targetTab = tabArray[index + 1] || tabArray[0];
            break;
        case 'Home':
            targetTab = tabArray[0];
            break;
        case 'End':
            targetTab = tabArray[tabArray.length - 1];
            break;
    }
    return targetTab;
}

function updateTabAttributes(selectedTab, allTabs) {
    allTabs.forEach(tab => {
        const isSelected = tab === selectedTab;
        tab.setAttribute('aria-selected', isSelected.toString());
        tab.setAttribute('tabindex', isSelected ? '0' : '-1');
        
        const panel = document.getElementById(tab.getAttribute('aria-controls'));
        if (panel) {
            panel.setAttribute('aria-hidden', (!isSelected).toString());
            panel.style.display = isSelected ? 'block' : 'none';
        }
    });
}

function setupButtonAccessibility() {
    // Add keyboard support for custom buttons
    const customButtons = document.querySelectorAll('.ratio-preset, .control-button');
    customButtons.forEach(button => {
        if (!button.hasAttribute('aria-label')) {
            button.setAttribute('aria-label', button.textContent.trim());
        }
        
        button.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                button.click();
            }
        });
    });
}

// Focus management
function manageFocus(element) {
    if (!element) return;
    element.focus();
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export {
    initializeAccessibility,
    announce,
    manageFocus
}; 