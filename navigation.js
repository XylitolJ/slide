/**
 * Navigation utility for theme-aware page navigation
 * This file provides comprehensive navigation functions for the theme system
 */

/**
 * Theme configuration mapping with complete page hierarchy
 */
const THEMES = {
    classic: {
        'index.html': 'index.html',
        'page3.html': 'page3.html',
        'infovong1.html': 'infovong1.html',
        'infovong2.html': 'infovong2.html',
        'infovong3.html': 'infovong3.html',
        'thuchanh.html': 'thuchanh.html',
        'lythuyet.html': 'lythuyet.html',
        'showquiz.html': 'showquiz.html',
        'vong1.html': 'vong1.html',
        'vong2.html': 'vong2.html',
        'vong3.html': 'vong3.html'
    },
    modern: {
        'index.html': 'indexv2.html',
        'page3.html': 'page3v2.html',
        'infovong1.html': 'infovong1v2.html',
        'infovong2.html': 'infovong2v2.html',
        'infovong3.html': 'infovong3v2.html',
        'thuchanh.html': 'thuchanhv2.html',
        'lythuyet.html': 'lythuyet.html',
        'showquiz.html': 'showquiz.html',
        'vong1.html': 'vong1.html',
        'vong2.html': 'vong2.html',
        'vong3.html': 'vong3.html'
    },
    elegant: {
        'index.html': 'indexv3.html',
        'page3.html': 'page3v3.html',
        'infovong1.html': 'infovong1v3.html',
        'infovong2.html': 'infovong2v3.html',
        'infovong3.html': 'infovong3v3.html',
        'thuchanh.html': 'thuchanhv3.html',
        'lythuyet.html': 'lythuyet.html',
        'showquiz.html': 'showquiz.html',
        'vong1.html': 'vong1.html',
        'vong2.html': 'vong2.html',
        'vong3.html': 'vong3.html'
    }
};

/**
 * Navigation hierarchy - defines parent-child relationships
 */
const NAVIGATION_HIERARCHY = {
    classic: {
        'page3.html': 'index.html',
        'infovong1.html': 'page3.html',
        'infovong2.html': 'page3.html',
        'infovong3.html': 'page3.html',
        'thuchanh.html': 'page3.html',
        'vong1.html': 'infovong1.html',
        'vong2.html': 'infovong2.html',
        'vong3.html': 'infovong3.html',
        'lythuyet.html': 'page3.html',
        'showquiz.html': 'lythuyet.html'
    },
    modern: {
        'page3v2.html': 'indexv2.html',
        'infovong1v2.html': 'page3v2.html',
        'infovong2v2.html': 'page3v2.html',
        'infovong3v2.html': 'page3v2.html',
        'thuchanhv2.html': 'page3v2.html',
        'vong1.html': 'infovong1v2.html',
        'vong2.html': 'infovong2v2.html',
        'vong3.html': 'infovong3v2.html',
        'lythuyet.html': 'page3v2.html',
        'showquiz.html': 'lythuyet.html'
    },
    elegant: {
        'page3v3.html': 'indexv3.html',
        'infovong1v3.html': 'page3v3.html',
        'infovong2v3.html': 'page3v3.html',
        'infovong3v3.html': 'page3v3.html',
        'thuchanhv3.html': 'page3v3.html',
        'vong1.html': 'infovong1v3.html',
        'vong2.html': 'infovong2v3.html',
        'vong3.html': 'infovong3v3.html',
        'lythuyet.html': 'page3v3.html',
        'showquiz.html': 'lythuyet.html'
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
 * Navigate to parent page based on current page and theme
 */
function navigateToParent() {
    const theme = getSelectedTheme();
    const currentPage = window.location.pathname.split('/').pop();
    
    // Find parent page in navigation hierarchy
    const hierarchy = NAVIGATION_HIERARCHY[theme];
    const parentPage = hierarchy[currentPage];
    
    if (parentPage) {
        window.location.href = parentPage;
    } else {
        // Fallback to main page
        navigateToMainPage();
    }
}

/**
 * Navigate to specific vong info page based on current theme
 * @param {number} vongNumber - The vong number (1, 2, or 3)
 */
function navigateToVongInfo(vongNumber) {
    const infoPage = `infovong${vongNumber}.html`;
    navigateToPage(infoPage);
}

/**
 * Navigate to specific vong quiz page
 * @param {number} vongNumber - The vong number (1, 2, or 3)
 */
function navigateToVong(vongNumber) {
    window.location.href = `vong${vongNumber}.html`;
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
