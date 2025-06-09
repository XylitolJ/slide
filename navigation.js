/**
 * Navigation utility for theme-aware page navigation
 * This file provides comprehensive navigation functions for the theme system
 */

/**
 * Theme configuration mapping
 */
const THEMES = {
    classic: {
        'index.html': 'index.html',
        'page3.html': 'page3.html',
        'infovong1.html': 'infovong1.html',
        'infovong2.html': 'infovong2.html',
        'infovong3.html': 'infovong3.html',
        'thuchanh.html': 'thuchanh.html'
    },
    modern: {
        'index.html': 'indexv2.html',
        'page3.html': 'page3v2.html',
        'infovong1.html': 'infovong1v2.html',
        'infovong2.html': 'infovong2v2.html',
        'infovong3.html': 'infovong3v2.html',
        'thuchanh.html': 'thuchanhv2.html'
    },
    elegant: {
        'index.html': 'indexv3.html',
        'page3.html': 'page3v3.html',
        'infovong1.html': 'infovong1v3.html',
        'infovong2.html': 'infovong2v3.html',
        'infovong3.html': 'infovong3v3.html',
        'thuchanh.html': 'thuchanhv3.html'
    }
};

/**
 * Get the currently selected theme from localStorage
 * @returns {string} The selected theme name
 */
function getSelectedTheme() {
    return localStorage.getItem('selectedTheme') || 'classic';
}

/**
 * Get the themed version of a page filename
 * @param {string} originalPage - The original page filename
 * @returns {string} The themed version of the page
 */
function getThemedPage(originalPage) {
    const theme = getSelectedTheme();
    return THEMES[theme] && THEMES[theme][originalPage] ? THEMES[theme][originalPage] : originalPage;
}

/**
 * Navigate to a specific page using the current theme
 * @param {string} page - The page to navigate to
 */
function navigateToPage(page) {
    const themedPage = getThemedPage(page);
    window.location.href = themedPage;
}

/**
 * Navigate to the main page using the current theme
 */
function navigateToMainPage() {
    navigateToPage('page3.html');
}

/**
 * Update all navigation links to use the current theme
 */
function updateNavigationLinks() {
    const theme = getSelectedTheme();
    
    // Update all links that point to themed pages
    Object.keys(THEMES.classic).forEach(originalPage => {
        const themedPage = getThemedPage(originalPage);
        
        // Update href attributes
        const links = document.querySelectorAll(`a[href="${originalPage}"]`);
        links.forEach(link => {
            link.href = themedPage;
        });
        
        // Update onclick handlers
        const buttons = document.querySelectorAll(`[onclick*="${originalPage}"]`);
        buttons.forEach(button => {
            const onclick = button.getAttribute('onclick');
            if (onclick) {
                button.setAttribute('onclick', onclick.replace(originalPage, themedPage));
            }
        });
    });
}

/**
 * Initialize the theme-aware navigation system
 */
function initializeNavigation() {
    // Update links on page load
    updateNavigationLinks();
    
    // Listen for storage changes to update links dynamically
    window.addEventListener('storage', function(e) {
        if (e.key === 'selectedTheme') {
            updateNavigationLinks();
        }
    });
}

/**
 * Navigate back to a specific page with theme awareness
 * @param {string} targetPage - The page to navigate back to
 */
function navigateBack(targetPage = 'index.html') {
    navigateToPage(targetPage);
}

/**
 * Get the current page filename without theme suffix
 * @returns {string} The base page filename
 */
function getCurrentBasePage() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Map themed pages back to their base names
    for (const [basePage, themedPages] of Object.entries(THEMES.classic)) {
        if (currentPage === basePage || 
            currentPage === THEMES.modern[basePage] || 
            currentPage === THEMES.elegant[basePage]) {
            return basePage;
        }
    }
    
    return currentPage;
}

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNavigation);
} else {
    initializeNavigation();
}
