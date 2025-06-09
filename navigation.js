/**
 * Navigation utility for redirecting to the selected main page design
 * This file provides a common function to navigate to the main page based on user settings
 */

/**
 * Get the currently selected main page design from localStorage
 * @returns {string} The filename of the selected page design
 */
function getSelectedMainPage() {
    return localStorage.getItem('pageDesign') || 'page3.html';
}

/**
 * Navigate to the selected main page design
 */
function navigateToMainPage() {
    const selectedPage = getSelectedMainPage();
    window.location.href = selectedPage;
}

/**
 * Update all links in the current page that point to page3.html
 * to use the currently selected main page design
 */
function updateMainPageLinks() {
    const selectedPage = getSelectedMainPage();
    
    // Update all links that point to page3.html
    const links = document.querySelectorAll('a[href="page3.html"]');
    links.forEach(link => {
        link.href = selectedPage;
    });
    
    // Update any buttons or elements with onclick handlers
    const buttons = document.querySelectorAll('[onclick*="page3.html"]');
    buttons.forEach(button => {
        const onclick = button.getAttribute('onclick');
        if (onclick) {
            button.setAttribute('onclick', onclick.replace('page3.html', selectedPage));
        }
    });
}

/**
 * Initialize the navigation system when DOM is loaded
 */
function initializeNavigation() {
    // Update links on page load
    updateMainPageLinks();
    
    // Listen for storage changes to update links dynamically
    window.addEventListener('storage', function(e) {
        if (e.key === 'pageDesign') {
            updateMainPageLinks();
        }
    });
}

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNavigation);
} else {
    initializeNavigation();
}
