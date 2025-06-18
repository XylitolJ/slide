// npx http-server -o
// JavaScript file for vong2 slide presentation
document.addEventListener('DOMContentLoaded', () => {    // DOM Elements
    const slideContainer = document.getElementById('slideContainer');
    // Header elements
    const headerEl = document.querySelector('.header'); 
    const questionNumberEl = document.getElementById('newQuestionNumber'); // Updated ID
    const questionCategoryEl = document.getElementById('newQuestionCategory'); // Updated ID
    const timerCircleEl = document.getElementById('timerProgress'); // Updated ID
    const timerTextEl = document.getElementById('timer'); // Updated ID
    const floatingTimerEl = document.getElementById('floatingTimer'); // Floating timer element
    // Main content elements
    const questionSectionEl = document.getElementById('questionSection'); 
    const questionTextContentEl = document.getElementById('questionTextContent');
    const optionsContainerEl = document.getElementById('optionsContainer'); 
    const imageAreaEl = document.getElementById('imageArea'); 
    const slideImageEl = document.getElementById('slideImage');
    const imageModalEl = document.getElementById('imageModal');
    const modalImageEl = document.getElementById('modalImage');
    // Footer elements
    const footerEl = document.querySelector('.footer'); 
    const progressTextEl = document.getElementById('progressText'); // ID remains the same, but element is in new footer
    const startSequenceBtn = document.getElementById('startSequenceBtn');
    const showAnswerBtn = document.getElementById('showAnswerBtn');
    // const footerContestInfoEl = document.getElementById('footerContestInfo')?.querySelector('span'); // This element might not exist in the new footer structure or needs re-evaluation
    // const footerTimeScoreEl = document.getElementById('footerTimeScore')?.querySelector('span'); // This element might not exist
    const footerProgressBarEl = document.getElementById('footerProgressBar');
    const roundInfoDisplayEl = document.getElementById('roundInfoDisplay'); // New element for round info    // Parse query parameters for selected question set from question_sets.json
    function getSelectedIds() {
        const params = new URLSearchParams(window.location.search);
        const setParam = params.get('set');
        
        // If no set parameter, return empty object (will load all questions)
        if (!setParam) return {};
        
        // Return set parameter for later use in loadQuestions
        return { set: setParam };
    }    // Popup
    const timesUpPopupEl = document.getElementById('timeUpOverlay'); // Updated ID for new overlay
    const startTimerPopupEl = document.getElementById('startTimerPopup'); // Start timer popup element// --- Configuration ---
    let DEBUG_MODE = 0; // 0 = normal, 1 = no timer, 2 = no timer + no audio
    const USE_SPEECH = true; // Set to false to disable all speech synthesis & audio file playback
    let PLAY_ANSWER_AUDIO = false; // Global variable to control answer audio playback (default: false)
    const SHOW_IMAGE_PLACEHOLDER_ON_ERROR = true; // If true, shows a placeholder if an image fails to load
    const IMAGE_PLACEHOLDER_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E"; // Simple image icon
    const DELAY_NO_SPEECH_QUESTION = 1000; // ms to wait after showing question if no speech
    const DELAY_NO_SPEECH_OPTION = 500;  // ms to wait after showing an option if no speech
    const DELAY_NO_SPEECH_ANSWER = 1000; // ms to wait after showing answer if no speech
      // THEME CONFIGURATION - Global variable to control header/footer theme
    // Options: 'default', 'category', 'round'
    const THEME_MODE = 'round'; // Change this to switch between theme modes    // State variables
    let allQuestions = [];
    let contestRoundsData = []; // To store data from quy_che_thi.cac_vong_thi
    let currentRound = 'vong2'; // Default round, will be determined from data
    let currentQuestionIndex = 0;
    let currentQuestionData = null;
    let timerInterval;    let timeLeft = 0; // Will be set per question
    const DEFAULT_TIME_PER_QUESTION = 60; // Default seconds for Round 2, can be overridden by JSON
    let audioContext;
    let currentAudio = null;
    let currentQuestionNumberAudio = null; // Track question number audio separately
    let sequenceInProgress = false;
    let answerShown = false;
    let navigationInProgress = false; // Add flag to prevent audio restart during navigation
    let shimmerTimer; // Glass shimmer timer
    const OPTION_KEYS = ['a', 'b', 'c', 'd', 'e', 'g']; // Possible option keys
    let selectedIds = [];

    // Theme management with localStorage support
    function getThemeMode() {
        return localStorage.getItem('slideThemeMode') || THEME_MODE;
    }

    // Glass Shimmer Functions
    function startGlassShimmerTimer() {
        if (shimmerTimer) clearTimeout(shimmerTimer);
        
        const randomInterval = Math.random() * (15000 - 5000) + 5000; // 5-15 giây
        shimmerTimer = setTimeout(() => {
            if (getThemeMode() === 'glass') {
                triggerGlassShimmer();
            }
            startGlassShimmerTimer(); // Lặp lại với interval ngẫu nhiên mới
        }, randomInterval);
    }

    function triggerGlassShimmer() {
        const header = document.querySelector('.header');
        const footer = document.querySelector('.footer');
        
        [header, footer].forEach(el => {
            if (el) {
                el.classList.add('glass-shimmer-active');
                setTimeout(() => {
                    el.classList.remove('glass-shimmer-active');
                }, 2000);
            }
        });
    }
    // Background styles for cleanup purposes only
    const backgroundStyles = [
        'bg-default', 'bg-abstract', 'bg-wave', 'bg-svg-pattern-1', 'bg-svg-pattern-2', 'bg-svg-pattern-3'
    ];

    // Initialize AudioContext
    function initAudio() {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.", e);
                progressTextEl.textContent = "Lỗi: Trình duyệt không hỗ trợ âm thanh.";
            }
        }
    }

    // --- Audio Playback ---
    async function playAudio(filePath, onEndCallback) {
        if (!USE_SPEECH || !audioContext || !filePath || navigationInProgress || DEBUG_MODE === 2) { // Check navigation flag and DEBUG_MODE 2
            if (onEndCallback) onEndCallback();
            return Promise.resolve();
        }

        // Stop any currently playing audio
        if (currentAudio && currentAudio.source) {
            currentAudio.source.stop();
            currentAudio.source.disconnect();
        }
        
        // Create a new audio object for each playback to handle 'ended' event correctly
        const audio = new Audio(filePath);
        currentAudio = audio; // Keep track of the current audio for potential interruption

        return new Promise((resolve, reject) => {
            audio.oncanplaythrough = () => {
                audio.play().catch(e => {
                    console.error(`Error playing audio ${filePath}:`, e);
                    if (onEndCallback) onEndCallback();
                    resolve(); // Resolve even on error to not block sequence
                });
            };
            audio.onended = () => {
                if (onEndCallback) onEndCallback();
                if (currentAudio === audio) currentAudio = null; // Clear if it's the one that ended
                resolve();
            };
            audio.onerror = (e) => {
                console.error(`Error loading audio ${filePath}:`, e);
                progressTextEl.textContent = `Lỗi tải file âm thanh: ${filePath.split('/').pop()}`;
                if (onEndCallback) onEndCallback();
                if (currentAudio === audio) currentAudio = null;
                resolve(); // Resolve to not block sequence
            };
            // Handle cases where oncanplaythrough might not fire (e.g. cached files)
            if (audio.readyState >= 3) { // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA
                 audio.play().catch(e => {
                    console.error(`Error playing audio ${filePath} (readyState >=3):`, e);
                    if (onEndCallback) onEndCallback();
                    resolve();
                });
            }
        });
    }    // Special function for playing question number audio that bypasses navigation check
    async function playQuestionNumberAudio(filePath, onEndCallback) {
        if (!USE_SPEECH || !filePath) {
            if (onEndCallback) onEndCallback();
            return Promise.resolve();
        }

        // Initialize audio context if not already done
        if (!audioContext) {
            initAudio();
        }

        // Stop any currently playing question number audio first
        if (currentQuestionNumberAudio) {
            try {
                currentQuestionNumberAudio.pause();
                currentQuestionNumberAudio.currentTime = 0;
                currentQuestionNumberAudio.src = '';
                currentQuestionNumberAudio.load();
            } catch (e) {
                console.error('Error stopping previous question number audio:', e);
            }
        }

        // Create a new audio object for question number playback
        const audio = new Audio(filePath);
        currentQuestionNumberAudio = audio; // Track this audio for stopping later

        return new Promise((resolve, reject) => {
            audio.oncanplaythrough = () => {
                audio.play().catch(e => {
                    console.error(`Error playing question number audio ${filePath}:`, e);
                    if (onEndCallback) onEndCallback();
                    resolve(); // Resolve even on error to not block sequence
                });
            };
            audio.onended = () => {
                if (onEndCallback) onEndCallback();
                if (currentQuestionNumberAudio === audio) currentQuestionNumberAudio = null; // Clear if it's the one that ended
                resolve();
            };
            audio.onerror = (e) => {
                console.error(`Error loading question number audio ${filePath}:`, e);
                if (onEndCallback) onEndCallback();
                if (currentQuestionNumberAudio === audio) currentQuestionNumberAudio = null;
                resolve(); // Resolve to not block sequence
            };
            // Handle cases where oncanplaythrough might not fire (e.g. cached files)
            if (audio.readyState >= 3) { // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA
                 audio.play().catch(e => {
                    console.error(`Error playing question number audio ${filePath} (readyState >=3):`, e);
                    if (onEndCallback) onEndCallback();
                    resolve();
                });
            }
        });
    }    // Global utility to stop all ongoing timers and audio without navigating away
    function stopAllEvents() {
        console.log('%c[STOP ALL EVENTS] Starting stopAllEvents() in app2.js', 'color: red; font-weight: bold;');
        
        // Stop question number audio first
        if (currentQuestionNumberAudio) {
            console.log('%c[STOP ALL EVENTS] Stopping question number audio', 'color: red;');
            try {
                currentQuestionNumberAudio.pause();
                currentQuestionNumberAudio.currentTime = 0; // Reset to beginning
                // Hủy bỏ callbacks
                currentQuestionNumberAudio.oncanplaythrough = null;
                currentQuestionNumberAudio.onended = null;
                currentQuestionNumberAudio.onerror = null;
                // Reset src và abort request
                currentQuestionNumberAudio.src = '';
                currentQuestionNumberAudio.load();
                currentQuestionNumberAudio = null;
                console.log('%c[STOP ALL EVENTS] Question number audio stopped successfully', 'color: green;');
            } catch (e) {
                console.error('[STOP ALL EVENTS] Error stopping question number audio:', e);
            }
        }
        
        // Stop Web Audio API audio
        if (currentAudio && currentAudio.source) {
            console.log('%c[STOP ALL EVENTS] Stopping Web Audio API audio', 'color: red;');
            try {
                currentAudio.source.stop();
                currentAudio.source.disconnect();
                currentAudio = null;
                console.log('%c[STOP ALL EVENTS] Web Audio API audio stopped successfully', 'color: green;');
            } catch (e) {
                console.error('[STOP ALL EVENTS] Error stopping Web Audio API:', e);
            }
        }
        
        // Stop HTML5 Audio elements
        if (currentAudio) {
            try {
                currentAudio.pause();
                currentAudio.currentTime = 0; // Reset to beginning
                // Hủy bỏ callbacks
                currentAudio.oncanplaythrough = null;
                currentAudio.onended        = null;
                currentAudio.onerror        = null;
                // Reset src và abort request
                currentAudio.src = '';
                currentAudio.load();
            } catch (e) {
                console.error('Error fully stopping audio:', e);
            }
            currentAudio = null;
            console.log('[STOP ALL EVENTS] Fully stopped audio element');
        }
        
        // Stop all audio elements on the page (failsafe)
        const allAudioElements = document.querySelectorAll('audio');
        console.log(`%c[STOP ALL EVENTS] Found ${allAudioElements.length} audio elements on page`, 'color: orange;');
        allAudioElements.forEach((audio, index) => {
            if (!audio.paused) {
                console.log(`%c[STOP ALL EVENTS] Stopping audio element ${index + 1}: ${audio.src}`, 'color: red;');
                audio.pause();
                audio.currentTime = 0;
            }
        });
        
        if (timerInterval) {
            console.log('%c[STOP ALL EVENTS] Clearing timer interval', 'color: red;');
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        if (timesUpPopupEl) {
            timesUpPopupEl.style.display = 'none';
            timesUpPopupEl.style.opacity = '0';
            timesUpPopupEl.style.animation = 'none';        }
        sequenceInProgress = false;
        answerShown = false;
        navigationInProgress = false; // Reset navigation flag        // Clean up ResizeObserver and timers if they exist
        const questionOptionsSection = document.getElementById('questionOptionsArea');
        if (questionOptionsSection) {
            if (questionOptionsSection._resizeObserver) {
                questionOptionsSection._resizeObserver.disconnect();
                questionOptionsSection._resizeObserver = null;
                console.log('%c[STOP ALL EVENTS] Cleaned up ResizeObserver', 'color: orange;');
            }
            if (questionOptionsSection._debounceTimer) {
                clearTimeout(questionOptionsSection._debounceTimer);
                questionOptionsSection._debounceTimer = null;
                console.log('%c[STOP ALL EVENTS] Cleaned up debounce timer', 'color: orange;');
            }
            if (questionOptionsSection._layoutCheckTimer) {
                clearTimeout(questionOptionsSection._layoutCheckTimer);
                questionOptionsSection._layoutCheckTimer = null;
                console.log('%c[STOP ALL EVENTS] Cleaned up layout check timer', 'color: orange;');
            }
            questionOptionsSection._isAdjusting = false;
        }
        
        console.log('%c[STOP ALL EVENTS] stopAllEvents() completed in app2.js', 'color: green; font-weight: bold;');
    }

    // --- UI Updates & Animations ---
    function animateElement(element, animationClass) {
        if (element) {
            const elementName = element.id || element.className.split(' ')[0] || 'unknownElement';
            console.log(`animateElement: Called for ${elementName} with animation class ${animationClass}`);
            console.log(`animateElement: BEFORE changes for ${elementName} - classList: ${element.classList.toString()}, opacity: ${getComputedStyle(element).opacity}, visibility: ${getComputedStyle(element).visibility}, display: ${getComputedStyle(element).display}`);

            // 1. Gỡ bỏ lớp ẩn ban đầu
            element.classList.remove('u-hidden-initially');

            // 2. Đặt lại visibility thành 'visible' và opacity ban đầu cho animation
            element.style.visibility = 'visible'; 
            element.style.opacity = '0'; // Bắt đầu animation từ trạng thái trong suốt
            console.log(`animateElement: AFTER visibility/opacity set for ${elementName} - classList: ${element.classList.toString()}, opacity: ${element.style.opacity}, visibility: ${element.style.visibility}`);

            // 3. Xóa các lớp animation cũ (nếu có)
            const knownAnimationClasses = ['slideInLeft', 'optionSlideInUp', 'imageFadeIn', 'question-appear', 'option-appear', 'image-appear'];
            knownAnimationClasses.forEach(cls => element.classList.remove(cls));
            
            // 4. Buộc trình duyệt reflow để áp dụng các thay đổi style trước khi thêm animation mới
            void element.offsetWidth; 

            // 5. Thêm lớp animation mới
            element.classList.add(animationClass);
            console.log(`animateElement: AFTER animationClass added for ${elementName} - classList: ${element.classList.toString()}`);

            // Optional: Log when animation ends
            element.addEventListener('animationend', () => {
                console.log(`animateElement: Animation ENDED for ${elementName}, final opacity: ${getComputedStyle(element).opacity}, visibility: ${getComputedStyle(element).visibility}`);
            }, { once: true });
        } else {
            console.warn('animateElement: Called with null or undefined element for animationClass:', animationClass);        }
    }    // Function to dynamically adjust layout based on content overflow
    function adjustLayoutForOverflow() {
        const questionOptionsSection = document.getElementById('questionOptionsArea');
        const imageAreaEl = document.getElementById('imageArea');
        const mainContentFlexContainer = document.querySelector('.px-8.py-4.flex-grow.flex.overflow-hidden');
        
        if (!questionOptionsSection || !imageAreaEl || !mainContentFlexContainer || !currentQuestionData) return;
        
        // Prevent recursive calls by checking if we're already adjusting
        if (questionOptionsSection._isAdjusting) return;
        questionOptionsSection._isAdjusting = true;
        
        // Check if questionOptionsArea has scroll
        const hasVerticalScroll = questionOptionsSection.scrollHeight > questionOptionsSection.clientHeight;
        const currentWidth = questionOptionsSection.classList.contains('w-4/5') ? '4/5' : 
                            questionOptionsSection.classList.contains('w-3/5') ? '3/5' : 
                            questionOptionsSection.classList.contains('w-2/5') ? '2/5' : 'unknown';
        
        if (hasVerticalScroll && !imageAreaEl.classList.contains('hidden') && currentWidth !== '4/5') {
            // Adjust to give more space to questions/options
            questionOptionsSection.classList.remove('w-3/5', 'w-2/5');
            questionOptionsSection.classList.add('w-4/5');
            imageAreaEl.classList.remove('w-2/5', 'w-3/5');
            imageAreaEl.classList.add('w-1/5');
            console.log('Layout adjusted: Questions area expanded due to overflow');
        } else if (!hasVerticalScroll && !imageAreaEl.classList.contains('hidden') && currentWidth === '4/5') {
            // Restore original layout when no overflow
            const isQuestionImage = currentQuestionData && currentQuestionData.question_image === 'Yes';
            
            if (isQuestionImage) {
                questionOptionsSection.classList.remove('w-4/5');
                questionOptionsSection.classList.add('w-2/5');
                imageAreaEl.classList.remove('w-1/5');
                imageAreaEl.classList.add('w-3/5');
            } else {
                questionOptionsSection.classList.remove('w-4/5');
                questionOptionsSection.classList.add('w-3/5');
                imageAreaEl.classList.remove('w-1/5');
                imageAreaEl.classList.add('w-2/5');
            }
            console.log('Layout restored: Original proportions due to no overflow');
        }
        
        // Reset the flag after a short delay
        setTimeout(() => {
            questionOptionsSection._isAdjusting = false;
        }, 100);    }

    // Function to change theme mode for testing (can be called from console)
    window.changeThemeMode = function(mode) {
        if (['default', 'category', 'round'].includes(mode)) {
            // Use a const override for testing
            window.THEME_MODE_OVERRIDE = mode;
            console.log(`Theme mode changed to: ${mode}`);
            // Re-apply theme with current question
            if (currentQuestionData) {
                applyTheme(currentQuestionData.category);
            }
        } else {
            console.log('Invalid theme mode. Use: default, category, or round');
        }
    };

    // Function to change current round for testing
    window.changeCurrentRound = function(round) {
        if (['vong1', 'vong2', 'vong3'].includes(round)) {
            currentRound = round;
            console.log(`Current round changed to: ${round}`);
            // Re-apply theme if in round mode
            if ((window.THEME_MODE_OVERRIDE || THEME_MODE) === 'round' && currentQuestionData) {
                applyTheme(currentQuestionData.category);
            }
        } else {
            console.log('Invalid round. Use: vong1, vong2, or vong3');
        }
    };    // Modified getThemeClass to use override if available
    function getThemeClassWithOverride(category) {
        const themeMode = getThemeMode();
        switch (themeMode) {
            case 'glass':
                return `header-footer-theme-glass header-footer-theme-glass-${currentRound}`;
                
            case 'round':
                return `header-footer-theme-${currentRound}`;
            
            case 'category':
                if (!category) return 'header-footer-theme-default';
                const normalizedCategory = category.toLowerCase().replace(/\s+/g, '-');
                if (normalizedCategory.includes('chính-sách-pháp-luật')) return 'header-footer-theme-cspl';
                if (normalizedCategory.includes('phòng-cháy-chữa-cháy')) return 'header-footer-theme-pccc';
                if (normalizedCategory.includes('y-tế')) return 'header-footer-theme-yte';
                if (normalizedCategory.includes('khai-thác-mỏ')) return 'header-footer-theme-ktm';
                if (normalizedCategory.includes('bảo-quản') || normalizedCategory.includes('bốc-xếp') || normalizedCategory.includes('vận-chuyển')) return 'header-footer-theme-bq-bx-vc';
                return 'header-footer-theme-default';
            
            case 'default':
            default:
                return 'header-footer-theme-default';
        }
    }

    function getThemeClass(category) {
        return getThemeClassWithOverride(category);
    }function applyTheme(category) {
        const themeClass = getThemeClass(category);
        // Define all possible theme classes to ensure only one is active on slideContainer
        const allClasses = [
            'header-footer-theme-default', 'header-footer-theme-cspl', 
            'header-footer-theme-pccc', 'header-footer-theme-yte', 
            'header-footer-theme-ktm', 'header-footer-theme-bq-bx-vc',
            'header-footer-theme-vong1', 'header-footer-theme-vong2', 'header-footer-theme-vong3',
            'header-footer-theme-glass', 'header-footer-theme-glass-vong1', 
            'header-footer-theme-glass-vong2', 'header-footer-theme-glass-vong3'
        ];
        // Apply theme to slideContainer, CSS will handle header/footer specifics
        if (slideContainer) {
            slideContainer.classList.remove(...allClasses); // Remove all theme classes
            slideContainer.classList.add(...themeClass.split(' ')); // Add the new theme class(es)
        }
    }// Function to render options in 3-column layout
    function renderThreeColumnOptions(questionData) {
        const threeColumnsContainer = document.getElementById('threeColumnsContainer');
        const column1Container = document.getElementById('column1Container');
        const column2Container = document.getElementById('column2Container');
        
        if (!threeColumnsContainer || !column1Container || !column2Container) {
            console.error('Three columns containers not found');
            return;
        }
        
        // Clear existing content
        column1Container.innerHTML = '';
        column2Container.innerHTML = '';
        
        // Track current column (1 for errors, 2 for solutions)
        let currentColumn = 1;
        let note1Added = false;
        let note2Added = false;        if (questionData.phuong_an) {
            // Don't sort, preserve the original order from JSON
            // This ensures Note1 -> a,b,c -> Note2 -> d,e,f... order is maintained
            const entries = Object.entries(questionData.phuong_an);
            
            // Track if we've encountered Note2 yet
            let hasEncounteredNote2 = false;
            
            entries.forEach(([key, value]) => {
                if (value) {
                    if (key.toLowerCase() === 'note1') {
                        // Add Note1 header to column 1
                        const headerEl = document.createElement('div');
                        headerEl.classList.add('column-header', 'errors');
                        headerEl.id = 'note1Header';
                        headerEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i>${value}`;
                        column1Container.appendChild(headerEl);
                        note1Added = true;
                    } else if (key.toLowerCase() === 'note2') {
                        // Add Note2 header to column 2
                        const headerEl = document.createElement('div');
                        headerEl.classList.add('column-header', 'solutions');
                        headerEl.id = 'note2Header';
                        headerEl.innerHTML = `<i class="fas fa-tools"></i>${value}`;
                        column2Container.appendChild(headerEl);
                        note2Added = true;
                        hasEncounteredNote2 = true; // Mark that we've seen Note2
                    } else {
                        // Regular option - place in appropriate column
                        const optionKeyUpper = key.toUpperCase();
                        const optionEl = document.createElement('div');
                        optionEl.id = `option${optionKeyUpper}`;
                        optionEl.dataset.optionKey = key;
                        optionEl.classList.add('option-card', 'rounded-lg', 'p-4', 'border-l-4', 'border-gray-400');
                        optionEl.style.opacity = '0';

                        const optionCharClass = `option-char-${key.toLowerCase()}`;
                        optionEl.innerHTML = `
                            <div class="flex items-center space-x-3">
                                <div class="option-char ${optionCharClass} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">${optionKeyUpper}</div>
                                <span class="text-gray-800 font-medium">${value}</span>
                            </div>
                        `;
                        
                        // Logic: if we haven't encountered Note2 yet, put in column 1 (errors)
                        // if we have encountered Note2, put in column 2 (solutions)
                        if (!hasEncounteredNote2) {
                            column1Container.appendChild(optionEl);
                        } else {
                            column2Container.appendChild(optionEl);
                        }
                    }
                }
            });
        }
        
        // Show the three columns container and hide regular options container
        threeColumnsContainer.classList.remove('hidden');
        threeColumnsContainer.classList.add('active');
        
        const optionsContainer = document.getElementById('optionsContainer');
        if (optionsContainer) {
            optionsContainer.style.display = 'none';
        }
        
        console.log('Three column layout rendered successfully');
    }

    function renderSlide(questionData) {
        console.log('--- renderSlide START ---', questionData);
        currentQuestionData = questionData;
        answerShown = false;
        sequenceInProgress = false;

        // Check for 3-column layout
        const isThreeColumnLayout = questionData.layout === '3columns';
        console.log('3-column layout detected:', isThreeColumnLayout);        // Apply background based on bg_image and bg_image_overlay properties
        if (slideContainer) {
            // First, remove any existing overlay classes to reset the state
            slideContainer.classList.remove('overlay-curtain', 'gradient', 'stripes');
            
            if (questionData.bg_image) {
                // Initially apply only the background image without overlay for visual appeal
                const webPath = questionData.bg_image.replace(/\\/g, '/');
                slideContainer.style.backgroundImage = `url('${webPath}')`;
                slideContainer.style.backgroundSize = 'cover';
                slideContainer.style.backgroundPosition = 'center';
                slideContainer.style.backgroundRepeat = 'no-repeat';
                slideContainer.classList.remove(...backgroundStyles);
                
                // Store overlay info for later use when question sequence starts
                slideContainer.dataset.bgOverlay = questionData.bg_image_overlay || 'none';
                slideContainer.dataset.bgImage = webPath;
            } else {
                // Fallback to default background if no bg_image is specified
                slideContainer.classList.remove(...backgroundStyles);
                slideContainer.style.backgroundImage = '';
                slideContainer.classList.add('bg-default');
                slideContainer.dataset.bgOverlay = 'none';
            }
        }
 
        const imageWrapperEl = document.getElementById('imageWrapper');

        if (questionSectionEl) questionSectionEl.classList.add('u-hidden-initially');
        if (optionsContainerEl) optionsContainerEl.classList.add('u-hidden-initially');
        if (imageAreaEl) imageAreaEl.classList.add('u-hidden-initially');
        
        if (questionSectionEl) {
            questionSectionEl.style.opacity = '0'; // Explicitly set for animation start
            console.log('renderSlide: questionSectionEl initial state - classList:', questionSectionEl.classList.toString(), 'opacity:', getComputedStyle(questionSectionEl).opacity, 'visibility:', getComputedStyle(questionSectionEl).visibility, 'display:', getComputedStyle(questionSectionEl).display);
        }
        if (imageWrapperEl) {
            imageWrapperEl.style.opacity = '0'; // Explicitly set for animation start
            console.log('renderSlide: imageWrapperEl initial state - classList:', imageWrapperEl.classList.toString(), 'opacity:', getComputedStyle(imageWrapperEl).opacity, 'visibility:', getComputedStyle(imageWrapperEl).visibility, 'display:', getComputedStyle(imageWrapperEl).display);
        }
         if (optionsContainerEl) { // Though options are dynamically added, good to log container state
            console.log('renderSlide: optionsContainerEl initial state - classList:', optionsContainerEl.classList.toString(), 'opacity:', getComputedStyle(optionsContainerEl).opacity, 'visibility:', getComputedStyle(optionsContainerEl).visibility, 'display:', getComputedStyle(optionsContainerEl).display);
        }

        questionTextContentEl.textContent = '';
        optionsContainerEl.innerHTML = ''; 
        slideImageEl.src = '';
        if(imageAreaEl) imageAreaEl.classList.add('hidden'); 
        
        progressTextEl.textContent = '';
        progressTextEl.classList.remove('answer-text-highlight'); // Remove highlight
        showAnswerBtn.style.display = 'none';
        startSequenceBtn.disabled = false;
        startSequenceBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'speaking-indicator');
        
        timesUpPopupEl.style.display = 'none';
        timesUpPopupEl.style.opacity = '0';        // Update header
        if (questionNumberEl) questionNumberEl.textContent = currentQuestionIndex + 1;
        if (questionCategoryEl) questionCategoryEl.textContent = questionData.category || 'Không có danh mục';
          // Trigger header and footer animations
        triggerHeaderFooterAnimation();
          // Initialize audio context if not already initialized (needed for auto-play)
        if (!audioContext) {
            initAudio();
        }
        
        // Play question number audio if available (always play, regardless of any state)
        if (questionData.speech_id_question_num && USE_SPEECH) {
            const audioPath = `speech/${questionData.speech_id_question_num}`;
            console.log(`Attempting to play question number audio: ${audioPath}`);
            // Always play question number audio immediately when question is rendered
            // Use a small delay to ensure the DOM is ready and previous audio is stopped
            setTimeout(() => {
                playQuestionNumberAudio(audioPath).catch(err => {
                    console.warn('Could not play question number audio:', err);
                });
            }, 50);
        }
        
        applyTheme(questionData.category);
 
        // Update footer progress bar
        if (footerProgressBarEl) footerProgressBarEl.style.width = `${((currentQuestionIndex + 1) / allQuestions.length) * 100}%`;
        
        // Update footer round information
        updateRoundInfoDisplay();

        // Set question text
        questionTextContentEl.textContent = questionData.cau_hoi;

        // Prepare image 
        let showImageArea = questionData.use_image === 'Yes' && questionData.image_id;
        const questionTextLength = questionData.cau_hoi.length;

        if (questionData.question_image !== 'Yes' && questionTextLength > 250 && questionData.use_image === 'Yes') {
            showImageArea = false;
        }
        
        const questionOptionsSection = document.getElementById('questionOptionsArea');
        // The main content container is the one with class 'px-8.py-4.flex-grow.flex.overflow-hidden'
        const mainContentFlexContainer = document.querySelector('.px-8.py-4.flex-grow.flex.overflow-hidden');        // Reset layout classes first
        if (mainContentFlexContainer) {
            mainContentFlexContainer.classList.remove('flex-col', 'flex-row'); // Remove old direction
            mainContentFlexContainer.classList.remove('three-columns-layout', 'single-column'); // Remove 3-column layout classes
        }
        if (questionOptionsSection) {
            questionOptionsSection.classList.remove('w-full', 'w-3/5', 'w-2/5', 'pr-6', 'pl-6');
            questionOptionsSection.style.order = ''; // Reset order
        }
        if (imageAreaEl) {
            imageAreaEl.classList.remove('w-full', 'w-3/5', 'w-2/5', 'pr-6', 'pl-6', 'h-2/3', 'py-4');
            imageAreaEl.style.order = ''; // Reset order
            imageAreaEl.classList.add('hidden'); // Default to hidden
        }
        if (imageWrapperEl) {
            imageWrapperEl.classList.remove('relative', 'w-full', 'question-image');
            imageWrapperEl.classList.add('absolute', 'inset-y-0', 'right-0', 'w-[calc(100%+3rem)]', 'custom-image-shape');
        }


        slideImageEl.onload = () => {
            if(showImageArea && imageAreaEl) {
                imageAreaEl.classList.remove('hidden');
            }
        };
        slideImageEl.onerror = () => {
            if (SHOW_IMAGE_PLACEHOLDER_ON_ERROR) {
                slideImageEl.src = IMAGE_PLACEHOLDER_SVG;
                slideImageEl.alt = "Không tìm thấy hình ảnh, hiển thị ảnh mẫu";
                if(showImageArea && imageAreaEl) {
                    imageAreaEl.classList.remove('hidden');
                }
            } else {
                if(imageAreaEl) imageAreaEl.classList.add('hidden');
                 // If image area is hidden, questionOptionsSection should take full width
                if(questionOptionsSection) questionOptionsSection.classList.add('w-full');
                if(mainContentFlexContainer) mainContentFlexContainer.classList.add('flex-row'); // Ensure row layout if no image
            }
        };

        if (showImageArea && imageAreaEl && questionOptionsSection && mainContentFlexContainer) {
            // Ensure the image area is made visible if an image is supposed to be shown
            imageAreaEl.classList.remove('hidden');
            
            slideImageEl.src = questionData.image_id;
            slideImageEl.alt = `Hình ảnh cho câu ${questionData.id}`;
            // The line below is now redundant due to the above change, but harmless if onload also calls it.
            // imageAreaEl.classList.remove('hidden'); // Handled by onload

            if (questionData.question_image === 'Yes') {
                mainContentFlexContainer.classList.add('flex-row');
                questionOptionsSection.classList.add('w-2/5', 'pr-6');
                questionOptionsSection.style.order = 1;
                imageAreaEl.classList.add('w-3/5', 'pl-6');
                imageAreaEl.style.order = 2;
                slideImageEl.classList.replace('object-cover', 'object-contain');
                if (imageWrapperEl) {
                    imageWrapperEl.classList.remove('absolute', 'inset-y-0', 'right-0', 'w-[calc(100%+3rem)]', 'custom-image-shape');
                    imageWrapperEl.classList.add('relative', 'w-full', 'question-image');
                }
            } else if (questionData.position_image === 'Left') {
                mainContentFlexContainer.classList.add('flex-row');
                questionOptionsSection.classList.add('w-3/5', 'pl-6');
                questionOptionsSection.style.order = 2;
                imageAreaEl.classList.add('w-2/5', 'pr-6');
                imageAreaEl.style.order = 1;
                slideImageEl.classList.replace('object-contain', 'object-cover');
            } else { // Default to Right or if position_image is 'Right'
                mainContentFlexContainer.classList.add('flex-row');
                questionOptionsSection.classList.add('w-3/5', 'pr-6');
                questionOptionsSection.style.order = 1;
                imageAreaEl.classList.add('w-2/5', 'pl-6');
                imageAreaEl.style.order = 2;
                slideImageEl.classList.replace('object-contain', 'object-cover');
            }        } else { // No image to show
            if(imageAreaEl) imageAreaEl.classList.add('hidden');
            if(questionOptionsSection) questionOptionsSection.classList.add('w-full');
            if(mainContentFlexContainer) mainContentFlexContainer.classList.add('flex-row');
        }        // Handle layout-specific styling for 3-column layout
        if (isThreeColumnLayout) {
            // Apply 3-column layout styling to main container
            if (mainContentFlexContainer) {
                mainContentFlexContainer.classList.add('three-columns-layout');
            }
            
            // For 3-column layout, check if image should be hidden
            if (!questionData.image_id || questionData.image_id === null) {
                // Hide image area for 3-column questions without images
                if (imageAreaEl) {
                    imageAreaEl.classList.add('hidden');
                }
                // Adjust grid to single column
                if (mainContentFlexContainer) {
                    mainContentFlexContainer.classList.add('single-column');
                }
            }
            
            console.log('Applied 3-column layout styling');
        }

        // Reset and hide 3-column containers initially
        const threeColumnsContainer = document.getElementById('threeColumnsContainer');
        if (threeColumnsContainer) {
            threeColumnsContainer.classList.add('hidden');
            threeColumnsContainer.classList.remove('active');
        }

        // Render options based on layout type
        if (isThreeColumnLayout) {
            // Use 3-column layout
            renderThreeColumnOptions(questionData);
        } else {
            // Use regular layout
            if (optionsContainerEl) {
                optionsContainerEl.style.display = 'grid'; // Ensure regular container is visible
            }
            
            if (questionData.phuong_an) {
                Object.entries(questionData.phuong_an).forEach(([key, value]) => {
                    if (value) {
                        // Check if this is a Note (section header)
                        if (key.toLowerCase().startsWith('note')) {
                            const noteEl = document.createElement('div');
                            noteEl.classList.add('note-section', 'mt-4', 'mb-2', 'px-4', 'py-2', 'bg-blue-50', 'border-l-4', 'border-blue-400', 'rounded-r-lg');
                            noteEl.innerHTML = `
                                <div class="flex items-center space-x-2">
                                    <i class="fas fa-info-circle text-blue-600"></i>
                                    <span class="text-blue-800 font-bold text-lg">${value}</span>
                                </div>
                            `;
                            optionsContainerEl.appendChild(noteEl);
                        } else {
                            // Regular option
                            const optionKeyUpper = key.toUpperCase();
                            const optionEl = document.createElement('div');
                            optionEl.id = `option${optionKeyUpper}`;
                            optionEl.dataset.optionKey = key;
                            // Add classes for card styling without white background
                            optionEl.classList.add('option-card', 'rounded-lg', 'p-4', 'border-l-4', 'border-gray-400');
                            optionEl.style.opacity = '0';

                            const optionCharClass = `option-char-${key.toLowerCase()}`;
                            // Ensure correct inner structure for flex layout and char styling
                            optionEl.innerHTML = `
                                <div class="flex items-center space-x-3">
                                    <div class="option-char ${optionCharClass} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">${optionKeyUpper}</div>
                                    <span class="text-gray-800 font-medium">${value}</span>
                                </div>
                            `;
                            optionsContainerEl.appendChild(optionEl);
                        }
                    }
                });
            }
        }
        
        // Set timer
        timeLeft = parseInt(questionData.thoi_gian_tra_loi) || DEFAULT_TIME_PER_QUESTION;
        if (questionData.type_question === "Thực hành") {
             timeLeft = parseInt(questionData.thoi_gian_chuan_bi) * 60 || 300;
        }
        timerTextEl.textContent = timeLeft;
        timerCircleEl.style.strokeDashoffset = '0'; // Reset to full circle for countdown timer
        timerCircleEl.classList.remove('warning', 'danger'); // Reset colors
        timerTextEl.classList.remove('warning', 'danger');   // Reset colors
        timerCircleEl.style.stroke = '#fff'; // Default stroke color from Test1.html CSS
        timerTextEl.style.color = '#fff'; // Default text color        // Set up a simple check for overflow after animations complete
        if (questionOptionsSection) {
            // Clear any existing timers and observers
            if (questionOptionsSection._resizeObserver) {
                questionOptionsSection._resizeObserver.disconnect();
                questionOptionsSection._resizeObserver = null;
            }
            if (questionOptionsSection._debounceTimer) {
                clearTimeout(questionOptionsSection._debounceTimer);
                questionOptionsSection._debounceTimer = null;
            }
            if (questionOptionsSection._layoutCheckTimer) {
                clearTimeout(questionOptionsSection._layoutCheckTimer);
            }
            
            questionOptionsSection._isAdjusting = false;
            
        // Schedule a single layout check after content is fully rendered
        questionOptionsSection._layoutCheckTimer = setTimeout(() => {
            adjustLayoutForOverflow();
        }, 1000); // Wait for animations to complete
    }
}

// Function to apply background overlay when question sequence starts
function applyBackgroundOverlay() {
        if (!slideContainer) return;
        
        const bgOverlay = slideContainer.dataset.bgOverlay;
        const bgImage = slideContainer.dataset.bgImage;
        
        if (bgOverlay && bgOverlay !== 'none' && bgImage) {
            // Set the background image directly on slideContainer
            slideContainer.style.backgroundImage = `url('${bgImage}')`;
            slideContainer.style.backgroundSize = 'cover';
            slideContainer.style.backgroundPosition = 'center';
            slideContainer.style.backgroundRepeat = 'no-repeat';
            
            // Remove any existing curtain classes
            slideContainer.classList.remove('overlay-curtain', 'gradient', 'stripes');
            
            // Force reflow to ensure the class removal takes effect
            void slideContainer.offsetHeight;
            
            // Apply curtain drop animation with overlay type
            setTimeout(() => {
                slideContainer.classList.add('overlay-curtain');
                if (bgOverlay === 'gradient') {
                    slideContainer.classList.add('gradient');
                    console.log('Applied gradient overlay curtain effect');
                } else if (bgOverlay === 'stripes') {
                    slideContainer.classList.add('stripes');
                    console.log('Applied stripes overlay curtain effect');
                }
            }, 100);
        }
    }

    // --- Timer Logic ---
    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        
        // Add active state to floating timer
        if (floatingTimerEl) {
            floatingTimerEl.classList.add('timer-active');
            floatingTimerEl.classList.remove('timer-warning', 'timer-danger');
        }

        if (DEBUG_MODE > 0) {
            progressTextEl.textContent = `DEBUG MODE ${DEBUG_MODE}: Timer disabled.`;
            timeLeft = 0;
            timerTextEl.textContent = "DEBUG";
            if (currentQuestionData.type_question !== "Thực hành") {
                showAnswerBtn.style.display = 'inline-block'; // Or 'flex' depending on new CSS
                showAnswerBtn.disabled = false;
                showAnswerBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
            return;
        }

        if (USE_SPEECH && (currentQuestionData.speech_id_timer || 'speech/60s.mp3')) {
            playAudio(currentQuestionData.speech_id_timer || 'speech/60s.mp3');
        }        const totalDuration = parseInt(currentQuestionData.thoi_gian_tra_loi) || DEFAULT_TIME_PER_QUESTION;
          // Reset circle to full for countdown
        timerCircleEl.style.strokeDashoffset = '0';
        void timerCircleEl.offsetWidth; // Force reflow

        // High-frequency timer for smooth updates (100ms)
        let lastSecond = timeLeft;
        timerInterval = setInterval(() => {
            timeLeft -= 0.1; // Decrease by 0.1 second each 100ms
            
            // Update text only when second changes
            if (Math.floor(timeLeft) !== Math.floor(lastSecond)) {
                timerTextEl.textContent = Math.ceil(timeLeft); // Round up for display
                lastSecond = timeLeft;
            }
              // Calculate progress for countdown timer (0 = full, 283 = empty)
            const progressRatio = Math.max(0, timeLeft / totalDuration); // Ensure non-negative
            const dashOffset = 283 * (1 - progressRatio); // As time decreases, dashOffset increases
            timerCircleEl.style.strokeDashoffset = dashOffset.toString();

            // Calculate continuous color based on progress ratio
            const currentColor = getTimerColor(progressRatio);
            timerCircleEl.style.stroke = currentColor;
            timerTextEl.style.color = currentColor;

            // Update floating timer states based on time remaining
            if (floatingTimerEl) {
                floatingTimerEl.classList.remove('timer-active', 'timer-warning', 'timer-danger');
                
                if (timeLeft <= 5) {
                    floatingTimerEl.classList.add('timer-danger');
                } else if (timeLeft <= 10) {
                    floatingTimerEl.classList.add('timer-warning');
                } else {
                    floatingTimerEl.classList.add('timer-active');
                }
            }            const headerProgressBarEl = document.getElementById('headerProgressBar');
            const progressPercentage = Math.max(0, (timeLeft / totalDuration) * 100);

            // Update floating timer states based on time remaining
            if (floatingTimerEl) {
                floatingTimerEl.classList.remove('timer-active', 'timer-warning', 'timer-danger');
                
                if (timeLeft <= 5) {
                    floatingTimerEl.classList.add('timer-danger');
                } else if (timeLeft <= 10) {
                    floatingTimerEl.classList.add('timer-warning');
                } else {
                    floatingTimerEl.classList.add('timer-active');
                }
            }

            if (headerProgressBarEl) {
                headerProgressBarEl.style.width = `${progressPercentage}%`;
                headerProgressBarEl.style.background = currentColor;
            }

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerTextEl.textContent = '0';
                timerCircleEl.style.strokeDashoffset = '283'; // Empty circle when time is up
                timerCircleEl.style.stroke = 'transparent'; // No stroke at 0
                
                // Remove all floating timer states when time is up
                if (floatingTimerEl) {
                    floatingTimerEl.classList.remove('timer-active', 'timer-warning', 'timer-danger');
                }
                
                if (!DEBUG_MODE && timesUpPopupEl) {
                    timesUpPopupEl.style.display = 'flex'; 
                    // Trigger animation for timesUpPopupEl
                    timesUpPopupEl.style.opacity = '0';
                    void timesUpPopupEl.offsetWidth; // reflow
                    timesUpPopupEl.style.animation = 'fadeInOverlay 0.5s ease-out forwards, slideInTimeUp 0.6s ease-out forwards';
                    const timeUpContent = timesUpPopupEl.querySelector('.time-up-content');
                    if(timeUpContent) timeUpContent.style.animation = 'pulseTimeUpSmooth 2s ease-in-out infinite 0.6s';
                }
                progressTextEl.textContent = 'Hết giờ! Các đội giơ đáp án.';
                if (currentQuestionData.type_question !== "Thực hành") {
                    showAnswerBtn.style.display = 'inline-block'; // Or 'flex'
                    showAnswerBtn.disabled = false;
                    showAnswerBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
                if (USE_SPEECH && currentQuestionData.speech_id_timeup) {
                    playAudio(currentQuestionData.speech_id_timeup);
                }            }
        }, 100); // Update every 100ms for smooth animation
    }
    
    // Function to calculate continuous timer color based on progress ratio
    function getTimerColor(progressRatio) {
        // progressRatio: 1 = full time, 0 = no time left
        // Color transition: Green → Yellow → Orange → Red
        
        if (progressRatio >= 0.66) {
            // Green to Yellow (100% to 66%)
            const localRatio = (progressRatio - 0.66) / 0.34;
            const red = Math.round(255 * (1 - localRatio));
            const green = 255;
            const blue = 255 * localRatio;
            return `rgb(${red}, ${green}, ${blue})`;
        } else if (progressRatio >= 0.33) {
            // Yellow to Orange (66% to 33%)
            const localRatio = (progressRatio - 0.33) / 0.33;
            const red = 255;
            const green = Math.round(255 * (0.5 + 0.5 * localRatio));
            const blue = 0;
            return `rgb(${red}, ${green}, ${blue})`;
        } else {
            // Orange to Red (33% to 0%)
            const localRatio = progressRatio / 0.33;
            const red = 255;
            const green = Math.round(165 * localRatio); // Orange has green=165
            const blue = 0;
            return `rgb(${red}, ${green}, ${blue})`;
        }
    }
    
    // --- Main Sequence Logic ---
    async function startQuestionSequence() {
        console.log('--- startQuestionSequence START ---');
        if (sequenceInProgress || answerShown) {
            console.log('startQuestionSequence: Aborted - sequenceInProgress:', sequenceInProgress, 'answerShown:', answerShown);
            return;
        }
        sequenceInProgress = true;
        initAudio();        startSequenceBtn.disabled = true;
        startSequenceBtn.classList.add('opacity-50', 'cursor-not-allowed', 'speaking-indicator');

        // Apply background overlay when question sequence starts
        applyBackgroundOverlay();

        // 1. Show Question and Image simultaneously
        const imageWrapperEl = document.getElementById('imageWrapper'); 
        
        // Start animations simultaneously
        if (questionSectionEl) questionSectionEl.classList.remove('u-hidden-initially');
        if (optionsContainerEl) optionsContainerEl.classList.remove('u-hidden-initially');
        if (imageAreaEl && slideImageEl.complete) imageAreaEl.classList.remove('u-hidden-initially');

        animateElement(questionSectionEl, 'question-appear');
        if (imageAreaEl && slideImageEl.complete) animateElement(imageAreaEl, 'image-appear');
        if (slideImageEl.src && imageAreaEl && !imageAreaEl.classList.contains('hidden') && imageWrapperEl) {
            console.log(`%cstartQuestionSequence: Attempting to animate image. Conditions: slideImageEl.src="${slideImageEl.src}", imageAreaEl exists=${!!imageAreaEl}, imageAreaEl.hidden=${imageAreaEl.classList.contains('hidden')}, imageWrapperEl exists=${!!imageWrapperEl}`, "color: green; font-weight: bold;");
            animateElement(imageWrapperEl, 'image-appear');
        } else {
            console.log(`%cstartQuestionSequence: Image will NOT be animated. Conditions: slideImageEl.src="${slideImageEl.src}", imageAreaEl exists=${!!imageAreaEl}, imageAreaEl.hidden=${imageAreaEl ? imageAreaEl.classList.contains('hidden') : 'N/A'}, imageWrapperEl exists=${!!imageWrapperEl}`, "color: red; font-weight: bold;");
        }
          // 2. Speak Question (after showing both question and image)
        if (DEBUG_MODE === 2) {
            // DEBUG MODE 2: Skip audio, use delay instead
            await new Promise(r => setTimeout(r, DELAY_NO_SPEECH_QUESTION));
        } else if (USE_SPEECH && currentQuestionData.speech_id_question) {
            await playAudio(`speech/${currentQuestionData.speech_id_question}`);
        } else {
            await new Promise(r => setTimeout(r, DELAY_NO_SPEECH_QUESTION));
        }// 3. Show & Speak Options based on layout type
        if ((currentQuestionData.type_question === "Trắc nghiệm" || currentQuestionData.type_question === "Trắc nghiệm Hình ảnh") && currentQuestionData.phuong_an) {
            
            // Check if this is a 3-column layout question
            const isThreeColumnLayout = currentQuestionData.layout === '3columns';
              if (isThreeColumnLayout) {
                // Handle 3-column layout sequence using the same order as JSON
                console.log('startQuestionSequence: Using 3-column audio sequence');
                
                // Get entries in the same order as JSON
                const entries = Object.entries(currentQuestionData.phuong_an);
                let hasEncounteredNote2 = false;
                
                // Step 1: Show Note1 header and play Note1 audio if available
                const note1Header = document.getElementById('note1Header');
                if (note1Header) {
                    console.log('startQuestionSequence: Showing Note1 header');
                    note1Header.classList.add('show');
                }
                
                if (USE_SPEECH && currentQuestionData.speech_id_note1) {
                    await playAudio(`speech/${currentQuestionData.speech_id_note1}`);
                } else {
                    await new Promise(r => setTimeout(r, DELAY_NO_SPEECH_OPTION));
                }
                
                // Step 2: Process entries in order
                for (const [key, value] of entries) {
                    if (key.toLowerCase() === 'note1') {
                        // Already handled above
                        continue;
                    } else if (key.toLowerCase() === 'note2') {
                        // Show Note2 header and play Note2 audio
                        const note2Header = document.getElementById('note2Header');
                        if (note2Header) {
                            console.log('startQuestionSequence: Showing Note2 header');
                            note2Header.classList.add('show');
                        }
                        
                        if (USE_SPEECH && currentQuestionData.speech_id_note2) {
                            await playAudio(`speech/${currentQuestionData.speech_id_note2}`);
                        } else {
                            await new Promise(r => setTimeout(r, DELAY_NO_SPEECH_OPTION));
                        }
                        
                        hasEncounteredNote2 = true;
                    } else if (value && key.match(/^[a-z]$/)) {
                        // Regular option - process in order
                        const optionEl = document.getElementById(`option${key.toUpperCase()}`);
                        if (optionEl) {
                            console.log(`startQuestionSequence: Animating 3-column option ${key} (${hasEncounteredNote2 ? 'column 2' : 'column 1'})`);
                            animateElement(optionEl, 'option-appear');
                            
                            const speechFileKey = `speech_id_options_${key.toUpperCase()}`;
                            const speechFile = currentQuestionData[speechFileKey];
                            
                            if (DEBUG_MODE === 2) {
                                // DEBUG MODE 2: Skip audio, use delay instead
                                await new Promise(r => setTimeout(r, DELAY_NO_SPEECH_OPTION));
                            } else if (USE_SPEECH && speechFile) {
                                await playAudio(`speech/${speechFile}`);
                            } else {
                                await new Promise(r => setTimeout(r, DELAY_NO_SPEECH_OPTION));
                            }
                        }
                    }
                }
                } else {
                // Regular layout - original logic
                const optionElements = optionsContainerEl.querySelectorAll('.option-card');
                console.log(`startQuestionSequence: Found ${optionElements.length} option elements to animate.`);
                
                let animationDelayBase = 0; // For staggering option animations
                for (let i = 0; i < optionElements.length; i++) {
                    const optionEl = optionElements[i];
                    console.log('startQuestionSequence: Animating option', optionEl.id);
                    
                    // Set animation delay for staggered effect
                    optionEl.style.animationDelay = `${animationDelayBase}s`;
                    animateElement(optionEl, 'option-appear');
                      // Speak option if audio exists
                    const optionKey = optionEl.dataset.optionKey;
                    const speechFileKey = `speech_id_options_${optionKey.toUpperCase()}`;
                    const speechFile = currentQuestionData[speechFileKey];
                    
                    if (DEBUG_MODE === 2) {
                        // DEBUG MODE 2: Skip audio, use delay instead
                        await new Promise(r => setTimeout(r, DELAY_NO_SPEECH_OPTION));
                    } else if (USE_SPEECH && speechFile) {
                        await playAudio(`speech/${speechFile}`);
                    } else {
                        await new Promise(r => setTimeout(r, DELAY_NO_SPEECH_OPTION));
                    }
                    
                    animationDelayBase += 0.15; // Stagger next option by 150ms
                }
            }
              } else if (currentQuestionData.type_question === "Thực hành") {
            // No options to show/speak for practical questions
            console.log('startQuestionSequence: Thực hành question - no options to show');
        }        // 4. Show "Bắt đầu!" popup and play bell sound before starting timer
        if (DEBUG_MODE === 0 && timeLeft > 0) {
            await showStartTimerPopup();
            startTimer();
        } else if (DEBUG_MODE > 0) {
            // Debug modes: Skip timer and show answer button if applicable
            console.log(`DEBUG MODE ${DEBUG_MODE}: Timer skipped`);
            if (currentQuestionData.type_question !== "Thực hành") {
                showAnswerBtn.style.display = 'inline-block'; 
                showAnswerBtn.disabled = false;
                showAnswerBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        } else if (timeLeft <= 0) { 
            showAnswerBtn.style.display = 'inline-block'; 
            showAnswerBtn.disabled = false;
            showAnswerBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        
        // Check layout after all animations complete
        setTimeout(() => {
            adjustLayoutForOverflow();
        }, 1500);
        
        startSequenceBtn.classList.remove('speaking-indicator');
        sequenceInProgress = false;
    }    // Function to trigger header and footer animations with enhanced effects
    function triggerHeaderFooterAnimation() {
        const header = document.querySelector('.header');
        const footer = document.querySelector('.footer');
        
        if (header) {
            // Remove existing animation class if present
            header.style.animation = 'none';
            // Force reflow to ensure animation is reset
            void header.offsetHeight;
            // Add animation with a slight delay to ensure proper triggering
            setTimeout(() => {
                header.style.animation = 'headerSlideDown 0.8s ease-out';
            }, 10);
        }
        
        if (footer) {
            // Remove existing animation class if present
            footer.style.animation = 'none';
            // Force reflow to ensure animation is reset
            void footer.offsetHeight;
            // Add animation with a slight delay to ensure proper triggering
            setTimeout(() => {
                footer.style.animation = 'footerSlideUp 0.8s ease-out';
            }, 10);
        }
        
        // Trigger enhanced question header animations
        triggerQuestionHeaderAnimations();
    }
      // Function to trigger enhanced question header animations
    function triggerQuestionHeaderAnimations() {
        const questionNumberContainer = questionNumberEl?.closest('.question-number');
        const categoryContainer = questionCategoryEl?.closest('.category-badge');
        const timerContainer = timerCircleEl?.closest('.timer-circle');
          // Reset all elements
        if (questionNumberContainer) {
            questionNumberContainer.classList.remove('question-number-scale', 'animate');
        }
        
        if (categoryContainer) {
            categoryContainer.classList.remove('category-badge-appear', 'animate');
            categoryContainer.style.opacity = '0';
            categoryContainer.style.transform = 'scale(0) rotate(-180deg)';
        }
        
        if (timerContainer) {
            timerContainer.classList.remove('timer-circle-delayed', 'animate');
            timerContainer.style.opacity = '0';
            timerContainer.style.transform = 'scale(0.3)';
        }
        
        // Force reflow
        void document.body.offsetHeight;
          // Step 1: Question Number appears first (scale and glow animation)
        setTimeout(() => {
            if (questionNumberContainer && questionNumberEl) {
                // Add scale and glow animation
                questionNumberContainer.classList.add('question-number-scale');
                questionNumberContainer.classList.add('animate');
            }
        }, 200);
        
        // Step 2: Category appears after 1s delay (badge appear effect)
        setTimeout(() => {
            if (categoryContainer) {
                categoryContainer.classList.add('category-badge-appear');
                categoryContainer.style.opacity = '';
                categoryContainer.style.transform = '';
                categoryContainer.classList.add('animate');
            }
        }, 1200);
        
        // Step 3: Timer appears last after 1.8s delay
        setTimeout(() => {
            if (timerContainer) {
                timerContainer.classList.add('timer-circle-delayed');
                timerContainer.style.opacity = '';
                timerContainer.style.transform = '';
                timerContainer.classList.add('animate');
            }
        }, 2000);
    }

    function highlightCorrectAnswer() {
        if (!currentQuestionData || !currentQuestionData.dap_an_dung) return;

        const correctAnswers = Array.isArray(currentQuestionData.dap_an_dung) 
                               ? currentQuestionData.dap_an_dung 
                               : [currentQuestionData.dap_an_dung];

        // Calculate points per correct answer for Round 2
        // If 4 correct answers: 2.5 points each
        // If 5 correct answers: 2 points each
        const totalCorrectAnswers = correctAnswers.length;
        const pointsPerAnswer = totalCorrectAnswers === 4 ? 2.5 : 2;

        // Check if this is a 3-column layout question
        const isThreeColumnLayout = currentQuestionData.layout === '3columns';
        
        correctAnswers.forEach(correctKey => {
            let correctOptionEl;
            
            if (isThreeColumnLayout) {
                // For 3-column layout, search in both column containers
                const threeColumnsContainer = document.getElementById('threeColumnsContainer');
                if (threeColumnsContainer) {
                    correctOptionEl = threeColumnsContainer.querySelector(`[data-option-key="${correctKey.toLowerCase()}"]`);
                }
            } else {
                // For regular layout, search in optionsContainer
                correctOptionEl = optionsContainerEl.querySelector(`[data-option-key="${correctKey.toLowerCase()}"]`);
            }
            
            if (correctOptionEl) {
                // Add the correct-answer class which handles all styling
                correctOptionEl.classList.add('correct-answer');

                // Add score badge to the option
                const scoreBadge = document.createElement('div');
                scoreBadge.classList.add('score-badge', 'ml-2', 'px-2', 'py-1', 'bg-amber-500', 'text-white', 'rounded-full', 'text-sm', 'font-bold', 'inline-flex', 'items-center');
                scoreBadge.innerHTML = `<i class="fas fa-star mr-1"></i>+${pointsPerAnswer}đ`;
                  // Find the option content and append the score badge
                const optionContent = correctOptionEl.querySelector('.flex.items-center.space-x-3');
                if (optionContent) {
                    optionContent.appendChild(scoreBadge);
                }
                
                // Ensure the option is visible and smoothly animated
                correctOptionEl.style.transition = 'all 0.5s ease';
                
                // Add a slight delay for dramatic effect
                setTimeout(() => {
                    correctOptionEl.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }, 300);
            }
        });
    }
    
async function displayAnswer() {
        if (answerShown || !currentQuestionData) return;
        answerShown = true;        if (timerInterval) clearInterval(timerInterval);
        
        // Immediately hide time-up overlay without delay or animation
        if (DEBUG_MODE === 0 && timesUpPopupEl) {
            timesUpPopupEl.style.display = 'none';
            timesUpPopupEl.style.opacity = '0';
            timesUpPopupEl.style.animation = 'none'; // Stop any ongoing animations
        }

        showAnswerBtn.disabled = true;
        showAnswerBtn.classList.add('opacity-50', 'cursor-not-allowed');
          let answerDisplayString = "";
        if (currentQuestionData.type_question === "Trắc nghiệm" || currentQuestionData.type_question === "Trắc nghiệm Hình ảnh") {
            if (currentQuestionData.dap_an_dung) {
                const correctKeys = Array.isArray(currentQuestionData.dap_an_dung) 
                                    ? currentQuestionData.dap_an_dung 
                                    : [currentQuestionData.dap_an_dung];
                
                // Calculate scoring info for Round 2
                const totalCorrectAnswers = correctKeys.length;
                const pointsPerAnswer = totalCorrectAnswers === 4 ? 2.5 : 2;
                const maxPoints = totalCorrectAnswers * pointsPerAnswer;
                
                answerDisplayString = `Đáp án: ${correctKeys.map(k => k.toUpperCase()).join(', ')}`;
                highlightCorrectAnswer();
            } else {
                answerDisplayString = "Không có đáp án cho câu này.";
            }
        } else if (currentQuestionData.type_question === "Lý thuyết tự luận" || currentQuestionData.type_question === "Câu hỏi hình ảnh") {
            if (typeof currentQuestionData.cau_tra_loi === 'string') {
                answerDisplayString = `<span class="font-bold">Đáp án:</span> (Chi tiết trong tài liệu)`;
            } else if (typeof currentQuestionData.cau_tra_loi === 'object' && currentQuestionData.cau_tra_loi !== null) {
                let structuredAnswer = "";
                for (const key in currentQuestionData.cau_tra_loi) {
                    structuredAnswer += `<p><strong>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> ${currentQuestionData.cau_tra_loi[key]}</p>`;
                }
                answerDisplayString = structuredAnswer; // This will be HTML
            }
             else {
                answerDisplayString = "Đáp án được trình bày bởi BGK/Tài liệu.";
            }        } else if (currentQuestionData.type_question === "Thực hành") {
            answerDisplayString = "Ban giám khảo chấm điểm thực hành.";
        }        progressTextEl.innerHTML = answerDisplayString; // Use innerHTML for potential HTML in answer
        progressTextEl.classList.add('answer-text-highlight'); // Add highlight class
 
        if (DEBUG_MODE === 2) {
            // DEBUG MODE 2: Skip audio, use delay instead
            await new Promise(r => setTimeout(r, DELAY_NO_SPEECH_ANSWER));
        } else if (USE_SPEECH && PLAY_ANSWER_AUDIO && currentQuestionData.speech_id_answer) {
            // Only play answer audio if PLAY_ANSWER_AUDIO is true
            await playAudio(`speech/${currentQuestionData.speech_id_answer}`);
        } else if (!USE_SPEECH || !PLAY_ANSWER_AUDIO) {
            await new Promise(r => setTimeout(r, DELAY_NO_SPEECH_ANSWER));
        }
    }

    // --- Navigation ---
    function nextQuestion() {
        console.log('nextQuestion: Starting navigation to next question');
        
        // Stop all ongoing events immediately
        stopAllEvents();
        
        // Reset states
        sequenceInProgress = false;
        answerShown = false;
        navigationInProgress = true; // Set flag to prevent other audio during transition

        if (currentQuestionIndex < allQuestions.length - 1) {
            currentQuestionIndex++;
            renderSlide(allQuestions[currentQuestionIndex]);
        } else {
            window.location.href = 'menu.html';
        }
        
        // Clear navigation flag after a short delay to allow audio to start
        setTimeout(() => {
            navigationInProgress = false;
            console.log('nextQuestion: Navigation flag cleared, ready for new audio');
        }, 100);
    }    function previousQuestion() {
        console.log('previousQuestion: Starting navigation to previous question');
        
        // Stop all ongoing events immediately
        stopAllEvents();
        
        // Reset states
        sequenceInProgress = false;
        answerShown = false;
        navigationInProgress = true; // Set flag to prevent other audio during transition

        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderSlide(allQuestions[currentQuestionIndex]);
        } else {
            // If we're at the first question, navigate back to menu.html
            window.location.href = 'menu.html';        }
        
        // Clear navigation flag after a short delay to allow audio to start
        setTimeout(() => {
            navigationInProgress = false;
            console.log('previousQuestion: Navigation flag cleared, ready for new audio');
        }, 100);
    }

    // --- Update Round Info Display ---
    function updateRoundInfoDisplay() {
        if (roundInfoDisplayEl && contestRoundsData.length > 0) {
            // Find Round 2 information
            const round2Info = contestRoundsData.find(round => round.vong === 2);
            if (round2Info) {
                roundInfoDisplayEl.innerHTML = `
                    <h3><i class="fas fa-trophy mr-2"></i>Vòng ${round2Info.vong}: ${round2Info.ten_vong}</h3>
                    <p>Thời gian trả lời: ${round2Info.thoi_gian_tra_loi} | Thang điểm: ${round2Info.thang_diem} điểm</p>
                `;
            } else {
                // Fallback if round info not found
                roundInfoDisplayEl.innerHTML = `
                    <h3><i class="fas fa-trophy mr-2"></i>Vòng 2: Khai thác mỏ</h3>
                    <p>Thời gian trả lời: 20 giây/câu | Thang điểm: 10 điểm</p>
                `;
            }
        }
    }    // --- Load Data ---
    async function loadQuestions() {
        try {
            // Load question sets configuration first
            const questionSetsResponse = await fetch('question_sets.json');
            if (!questionSetsResponse.ok) {
                throw new Error(`HTTP error loading question_sets.json! status: ${questionSetsResponse.status}`);
            }
            const questionSetsData = await questionSetsResponse.json();            console.log('Loaded question_sets.json:', questionSetsData);

            // Determine current round from question_sets.json and URL parameters
            const selectedParams = getSelectedIds();
            if (selectedParams && selectedParams.set) {
                // Try to find which round contains the selected set
                for (const roundKey in questionSetsData) {
                    if (questionSetsData[roundKey] && questionSetsData[roundKey][selectedParams.set]) {
                        currentRound = roundKey;
                        break;
                    }
                }
            } else {
                // Default to vong2 (this page is specifically for vong2)
                currentRound = 'vong2';
            }
            console.log('Current round determined:', currentRound);

            // Load Round 2 questions from vong2.json
            const response = await fetch('vong2.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Load contest rules data for round information
            let contestRulesData = null;
            try {
                const rulesResponse = await fetch('quyche.json');
                if (rulesResponse.ok) {
                    const rulesData = await rulesResponse.json();
                    contestRulesData = rulesData.quy_che_thi;
                    if (contestRulesData && Array.isArray(contestRulesData.cac_vong_thi)) {
                        contestRoundsData = contestRulesData.cac_vong_thi;
                    }
                }
            } catch (rulesError) {
                console.warn("Could not load contest rules:", rulesError);
            }
              // Extract all questions from chosen data source
            // Check if demo mode is enabled
            const isDemoMode = localStorage.getItem('demoMode') === 'true';
            
            // Choose data source based on demo mode
            const sourceData = isDemoMode ? data.demo : data.vong_2;
            
            let allAvailableQuestions = [];
            
            for (const categoryKey in sourceData) {
                const category = sourceData[categoryKey];
                for (const typeKey in category) {
                    if (Array.isArray(category[typeKey])) {
                        allAvailableQuestions = allAvailableQuestions.concat(category[typeKey]);
                    }
                }
            }// Get selected set from URL parameters  
            console.log('Selected parameters:', selectedParams);
              // Filter questions based on question_sets.json configuration or demo mode
            allQuestions = [];
            
            if (isDemoMode) {
                // For demo mode, use all available demo questions
                allQuestions = allAvailableQuestions;
                console.log(`Demo mode: Loaded ${allQuestions.length} demo questions for vong2`);
            } else if (selectedParams && selectedParams.set) {
                // Load specific set from question_sets.json (new structure: vong2[set])
                const questionIds = questionSetsData.vong2?.[selectedParams.set];                if (questionIds && Array.isArray(questionIds)) {
                    console.log(`Loading questions for set "${selectedParams.set}":`, questionIds);
                    
                    // Filter questions based on IDs from question_sets.json
                    // Use map to preserve order, then filter out null results
                    allQuestions = questionIds.map(questionId => {
                        const question = allAvailableQuestions.find(q => q.id === questionId);
                        if (!question) {
                            console.warn(`Question with ID "${questionId}" not found in vong2.json`);
                        }
                        return question;
                    }).filter(q => q !== null && q !== undefined);
                } else {
                    console.error(`Set "${selectedParams.set}" not found in question_sets.json for vong2`);
                    // Fallback to all questions if set not found
                    allQuestions = allAvailableQuestions;
                }} else {
                // No specific set selected, load questions from question_sets.json set "1" as default
                console.log('No specific set selected, loading default set "1" from question_sets.json');
                const defaultQuestionIds = questionSetsData.vong2?.["1"];
                if (defaultQuestionIds && Array.isArray(defaultQuestionIds)) {
                    console.log('Loading default set "1":', defaultQuestionIds);
                    allQuestions = defaultQuestionIds.map(questionId => {
                        const question = allAvailableQuestions.find(q => q.id === questionId);
                        if (!question) {
                            console.warn(`Question with ID "${questionId}" not found in vong2.json`);
                        }
                        return question;
                    }).filter(q => q !== null && q !== undefined);
                } else {
                    console.warn('Default set "1" not found in question_sets.json, loading all questions');
                    allQuestions = allAvailableQuestions;
                }
            }            if (allQuestions.length > 0) {
                const modeText = isDemoMode ? 'demo' : 'normal';
                console.log(`${modeText} mode: Loaded ${allQuestions.length} questions for vong2 based on ${isDemoMode ? 'demo data' : 'question_sets.json configuration'}`);
                // Update round info display
                updateRoundInfoDisplay();
                renderSlide(allQuestions[currentQuestionIndex]);
                
                // Start glass shimmer timer if glass theme is enabled
                if (getThemeMode() === 'glass') {
                    startGlassShimmerTimer();
                }
            } else {
                progressTextEl.textContent = isDemoMode ? 
                    "Không tìm thấy câu hỏi demo nào." : 
                    "Không tìm thấy câu hỏi phù hợp theo cấu hình trong question_sets.json.";
            }
        } catch (error) {
            console.error("Could not load questions:", error);
            progressTextEl.textContent = "Lỗi tải dữ liệu câu hỏi. Vui lòng kiểm tra file vong2.json, question_sets.json và console.";        }
    }

    // --- Emergency Exit Function ---
    function emergencyExitToPage3() {
        // Stop question number audio
        if (currentQuestionNumberAudio) {
            currentQuestionNumberAudio.pause();
            currentQuestionNumberAudio.currentTime = 0;
            currentQuestionNumberAudio.src = '';
            currentQuestionNumberAudio.load();
            currentQuestionNumberAudio = null;
        }
        
        // Stop all audio
       
        if (currentAudio && currentAudio.source) {
            currentAudio.source.stop();
            currentAudio.source.disconnect();
            currentAudio = null;
        }
        
        // Clear all timers
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        // Reset all flags
        sequenceInProgress = false;
        answerShown = false;
          // Navigate to menu.html
        window.location.href = 'menu.html';
    }
    
    function toggleAnswerAudioMode() {
        PLAY_ANSWER_AUDIO = !PLAY_ANSWER_AUDIO;
        console.log(`Answer audio mode: ${PLAY_ANSWER_AUDIO ? 'ENABLED' : 'DISABLED'}`);
        
        // Optional: Show a visual indicator
        const indicator = document.createElement('div');
        indicator.textContent = `Chế độ đọc đáp án: ${PLAY_ANSWER_AUDIO ? 'BẬT' : 'TẮT'}`;
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${PLAY_ANSWER_AUDIO ? '#10b981' : '#ef4444'};
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 10000;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            indicator.remove();
        }, 2000);
    }

    // --- Show Start Timer Popup ---
    async function showStartTimerPopup() {
        if (!startTimerPopupEl) return;
        
        // Show popup with animation
        startTimerPopupEl.style.display = 'flex';
        // Force reflow before adding show class for smooth animation
        void startTimerPopupEl.offsetHeight;
        startTimerPopupEl.classList.add('show');
        
        // Play bell sound
        if (USE_SPEECH && DEBUG_MODE !== 2) {
            try {
                await playAudio('speech/bell.mp3');
            } catch (error) {
                console.warn('Could not play bell sound:', error);
            }
        }
        
        // Wait for animation and sound to complete (minimum 1.5 seconds)
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Hide popup with animation
        startTimerPopupEl.classList.remove('show');
        await new Promise(resolve => setTimeout(resolve, 200)); // Wait for fade out
        startTimerPopupEl.style.display = 'none';
    }

    // --- Event Listeners ---
    startSequenceBtn.addEventListener('click', startQuestionSequence);
    showAnswerBtn.addEventListener('click', displayAnswer);
    if (slideImageEl && imageModalEl && modalImageEl) {
        slideImageEl.addEventListener('click', () => {
            if (!slideImageEl.src) return;            modalImageEl.src = slideImageEl.src;
            imageModalEl.classList.remove('hidden');
        });

        imageModalEl.addEventListener('click', () => {
            imageModalEl.classList.add('hidden');
            modalImageEl.src = '';
        });
    }

    document.addEventListener('keydown', (e) => {
        console.log('Key pressed in app2.js:', e.key); // Debug log
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            console.log('Arrow Right pressed - calling nextQuestion()');
            stopAllEvents();
            nextQuestion();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            console.log('Arrow Left pressed - calling previousQuestion()');
            stopAllEvents();
            previousQuestion();        } else if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault(); 
            if (!startSequenceBtn.disabled) {
                startQuestionSequence();
            }
        } else if (e.key === 'Enter') {
            if (!showAnswerBtn.disabled && showAnswerBtn.style.display !== 'none') {
                e.preventDefault();
                displayAnswer();
            }
        } else if (e.key === '0' && e.ctrlKey) { // Ctrl+0 for DEBUG mode 1
            e.preventDefault();
            DEBUG_MODE = 1;
            console.log('DEBUG MODE 1 activated: Timer disabled');
            progressTextEl.textContent = 'Timer disabled';        } else if (e.key === '9' && e.ctrlKey) { // Ctrl+9 for DEBUG mode 2
            e.preventDefault();
            DEBUG_MODE = 2;
            console.log('DEBUG MODE 2 activated: Timer and audio disabled');
            progressTextEl.textContent = 'Timer and audio disabled';        } else if (e.key.toLowerCase() === 'd' && e.ctrlKey) { // Ctrl+D to toggle debug
            e.preventDefault();
            console.log("Debug mode toggle attempted. Use Ctrl+0 or Ctrl+9 for specific debug modes.");
        } else if (e.key.toLowerCase() === 'm' && e.ctrlKey && e.altKey) { // Ctrl+Alt+M to toggle answer audio
            e.preventDefault();
            toggleAnswerAudioMode();
        } else if (e.key.toLowerCase() === 'q') { // Q key for emergency exit
            e.preventDefault();
            emergencyExitToPage3();
        } else if (e.key === '2') { // Number 2 key to go to info page for round 2
            e.preventDefault();
            window.location.href = 'infovong2.html';
        }
    });

    // --- Initialization ---
    // Initialize audio context early for auto-play to work
    initAudio();
    loadQuestions();
});