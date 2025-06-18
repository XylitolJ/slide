// npx http-server -o --no-cache
document.addEventListener('DOMContentLoaded', () => {
    applyFontSettings();    // DOM Elements
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
    // Footer elements
    const footerEl = document.querySelector('.footer'); 
    const progressTextEl = document.getElementById('progressText'); // ID remains the same, but element is in new footer
    const startSequenceBtn = document.getElementById('startSequenceBtn');
    const showAnswerBtn = document.getElementById('showAnswerBtn');
    // const footerContestInfoEl = document.getElementById('footerContestInfo')?.querySelector('span'); // This element might not exist in the new footer structure or needs re-evaluation
    // const footerTimeScoreEl = document.getElementById('footerTimeScore')?.querySelector('span'); // This element might not exist
    const footerProgressBarEl = document.getElementById('footerProgressBar');
    const roundInfoDisplayEl = document.getElementById('roundInfoDisplay'); // New element for round info    // Popup elements
    const timesUpPopupEl = document.getElementById('timeUpOverlay'); // Updated ID for new overlay
    const startTimerPopupEl = document.getElementById('startTimerPopup'); // Start timer popup element    // --- Configuration --- 
    let DEBUG_MODE = 0; // 0 = normal, 1 = no timer, 2 = no timer + no audio
    const USE_SPEECH = localStorage.getItem("useSpeech") !== "false";
    let PLAY_ANSWER_AUDIO = false; // Global variable to control answer audio playback (default: false)
    const SHOW_IMAGE_PLACEHOLDER_ON_ERROR = true; // If true, shows a placeholder if an image fails to load
    const IMAGE_PLACEHOLDER_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E"; // Simple image icon

    const DELAY_NO_SPEECH_QUESTION = 1000; // ms to wait after showing question if no speech
    const DELAY_NO_SPEECH_OPTION = 500;  // ms to wait after showing an option if no speech
    const DELAY_NO_SPEECH_ANSWER = 1000; // ms to wait after showing answer if no speech
    
    // THEME CONFIGURATION - Global variable to control header/footer theme
    // Options: 'default', 'category', 'round'
    const THEME_MODE = 'round'; // Change this to switch between theme modes

    function applyFontSettings(){
        const qSize = localStorage.getItem("fontSizeQuestion");
        const oSize = localStorage.getItem("fontSizeOption");
        if(qSize) document.documentElement.style.setProperty("--question-font-size", qSize+"px");
        if(oSize) document.documentElement.style.setProperty("--option-font-size", oSize+"px");
    }    // State variables
    let allQuestions = [];
    let contestRoundsData = []; // To store data from quy_che_thi.cac_vong_thi
    let currentRound = 'vong1'; // Default round for vong1.html
    let currentQuestionIndex = 0;
    let currentQuestionData = null;    let timerInterval;
    let timeLeft = 0; // Will be set per question
    const DEFAULT_TIME_PER_QUESTION = 30; // Default seconds, can be overridden by JSON
    let audioContext;
    let currentAudio = null;
    let currentQuestionNumberAudio = null; // Track question number audio separately
    let sequenceInProgress = false;
    let answerShown = false;
    let navigationInProgress = false; // Add flag to prevent audio restart during navigation
    let timeUpPopupVisible = false; // Track when time's up popup is visible
    
    const OPTION_KEYS = ['a', 'b', 'c', 'd', 'e', 'g']; // Possible option keys
      // Background styles for cleanup purposes only
    const backgroundStyles = [
        'bg-default', 'bg-abstract', 'bg-wave', 'bg-svg-pattern-1', 'bg-svg-pattern-2', 'bg-svg-pattern-3'
    ];
    let shimmerTimer; // Glass shimmer timer

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

    // Initialize AudioContext
    function initAudio() {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.", e);
                progressTextEl.textContent = "Lỗi: Trình duyệt không hỗ trợ âm thanh.";
                }
        }    }            // --- Audio Playback ---
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
    }

    // Special function for playing question number audio that bypasses navigation check
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
            }        });
    }

    // --- Show Start Timer Popup ---
    async function showStartTimerPopup() {
        console.log('showStartTimerPopup called');
        const popupEl = document.getElementById('startTimerPopup');
        if (!popupEl) {
            console.error('Start timer popup element not found!');
            return;
        }
        
        console.log('Start timer popup element found, showing popup');
        
        // Show popup with animation
        popupEl.style.display = 'flex';
        // Force reflow before adding show class for smooth animation
        void popupEl.offsetHeight;
        popupEl.classList.add('show');
        
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
        popupEl.classList.remove('show');
        await new Promise(resolve => setTimeout(resolve, 200)); // Wait for fade out
        popupEl.style.display = 'none';
        
        console.log('Start timer popup hidden');
    }

    // Function to trigger header and footer animations with enhanced effects
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
            console.warn('animateElement: Called with null or undefined element for animationClass:', animationClass);
        }
    }
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
    };    // Theme management with localStorage support
    function getThemeMode() {
        return localStorage.getItem('slideThemeMode') || THEME_MODE;
    }

    // Modified getThemeClass to use override if available
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
    }    function applyTheme(category) {
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
    }
    function renderSlide(questionData) {
        console.log('--- renderSlide START ---', questionData);
        currentQuestionData = questionData;
        answerShown = false;
        sequenceInProgress = false;        // Apply background based on bg_image and bg_image_overlay properties
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
        showAnswerBtn.style.display = 'none';        startSequenceBtn.disabled = false;
        startSequenceBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'speaking-indicator');
        
        timesUpPopupEl.style.display = 'none';
        timesUpPopupEl.style.opacity = '0';
        timeUpPopupVisible = false; // Reset flag when rendering new slide// Update header
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
        if (roundInfoDisplayEl && contestRoundsData.length > 0) {
            let cumulativeQuestions = 0;
            let currentRound = null;
            for (let i = 0; i < contestRoundsData.length; i++) {
                const round = contestRoundsData[i];
                if (currentQuestionIndex < cumulativeQuestions + round.so_cau_hoi) {
                    currentRound = round;
                    break;
                }
                cumulativeQuestions += round.so_cau_hoi;
            }

            if (currentRound) {
                roundInfoDisplayEl.innerHTML = `
                    <h3><i class="fas fa-trophy mr-2"></i>Vòng ${currentRound.vong}: ${currentRound.ten_vong}</h3>
                    <p>Thời gian trả lời: ${currentRound.thoi_gian_tra_loi} | Thang điểm: ${currentRound.thang_diem} điểm</p>
                `;
            } else {
                roundInfoDisplayEl.innerHTML = ''; // Clear if no round info found (should not happen)
            }
        }

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
        const mainContentFlexContainer = document.querySelector('.px-8.py-4.flex-grow.flex.overflow-hidden');

        // Reset layout classes first
        if (mainContentFlexContainer) {
            mainContentFlexContainer.classList.remove('flex-col', 'flex-row'); // Remove old direction
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
                mainContentFlexContainer.classList.add('flex-col');
                questionOptionsSection.classList.add('w-full');
                questionOptionsSection.style.order = 1;
                imageAreaEl.classList.add('w-full', 'h-2/3', 'py-4'); // Adjust image height as needed
                imageAreaEl.style.order = 2;
                slideImageEl.classList.replace('object-cover', 'object-contain');
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
            }
        } else { // No image to show
            if(imageAreaEl) imageAreaEl.classList.add('hidden');
            if(questionOptionsSection) questionOptionsSection.classList.add('w-full');
            if(mainContentFlexContainer) mainContentFlexContainer.classList.add('flex-row');
        }

        if (questionData.phuong_an) {
            Object.entries(questionData.phuong_an).forEach(([key, value]) => {
                if (value) {
                    const optionKeyUpper = key.toUpperCase();
                    const optionEl = document.createElement('div');
                    optionEl.id = `option${optionKeyUpper}`;
                    optionEl.dataset.optionKey = key;
                    // Add Tailwind classes for card styling directly here
                    optionEl.classList.add('option-card', 'bg-white', 'bg-opacity-90', 'rounded-lg', 'p-4', 'border-l-4', 'border-gray-400');
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
            });
        }
        
        // Set timer
        timeLeft = parseInt(questionData.thoi_gian_tra_loi) || DEFAULT_TIME_PER_QUESTION;
        if (questionData.type_question === "Thực hành") {
             timeLeft = parseInt(questionData.thoi_gian_chuan_bi) * 60 || 300;
        }
        timerTextEl.textContent = timeLeft;        timerCircleEl.style.strokeDashoffset = '0'; // Reset to full circle for countdown timer
        timerCircleEl.classList.remove('warning', 'danger'); // Reset colors
        timerTextEl.classList.remove('warning', 'danger');   // Reset colors
        timerCircleEl.style.stroke = '#fff'; // Default stroke color from Test1.html CSS
        timerTextEl.style.color = '#fff'; // Default text color
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

        if (USE_SPEECH && (currentQuestionData.speech_id_timer || 'speech/30s.mp3')) {
            playAudio(currentQuestionData.speech_id_timer || 'speech/30s.mp3');
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

            const headerProgressBarEl = document.getElementById('headerProgressBar');
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
            }            if (headerProgressBarEl) {
                headerProgressBarEl.style.width = `${progressPercentage}%`;
                headerProgressBarEl.style.background = currentColor;
            }

            if (timeLeft <= 0) {                clearInterval(timerInterval);
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

                    // Set flag that time's up popup is visible and disable navigation
                    timeUpPopupVisible = true;
                }
                progressTextEl.textContent = 'Hết giờ! Các đội giơ đáp án.';
                if (currentQuestionData.type_question !== "Thực hành") {
                    showAnswerBtn.style.display = 'inline-block'; // Or 'flex'
                    showAnswerBtn.disabled = false;
                    showAnswerBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }                if (USE_SPEECH && currentQuestionData.speech_id_timeup) {
                    playAudio(currentQuestionData.speech_id_timeup);                }
            }
        }, 100); // Update every 100ms for smooth animation
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
        }

        // 3. Show & Speak Options (if Trac nghiem)
        if (currentQuestionData.type_question === "Trắc nghiệm" && currentQuestionData.phuong_an) {
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
        
        startSequenceBtn.classList.remove('speaking-indicator');
        sequenceInProgress = false;
    }    function highlightCorrectAnswer() {
        if (!currentQuestionData || !currentQuestionData.dap_an_dung) return;

        const correctAnswers = Array.isArray(currentQuestionData.dap_an_dung) 
                               ? currentQuestionData.dap_an_dung 
                               : [currentQuestionData.dap_an_dung];

        // For Round 1, total points per question is 10, divided equally among correct answers
        const totalPoints = 10;
        const numberOfCorrectAnswers = correctAnswers.length;
        const pointsPerAnswer = Math.round((totalPoints / numberOfCorrectAnswers) * 10) / 10; // Round to 1 decimal place

        correctAnswers.forEach(correctKey => {
            const correctOptionEl = optionsContainerEl.querySelector(`[data-option-key="${correctKey.toLowerCase()}"]`);
            if (correctOptionEl) {
                // Add the correct-answer class which handles all styling
                correctOptionEl.classList.add('correct-answer');

                // Add score badge to the option
                const scoreBadge = document.createElement('div');
                scoreBadge.classList.add('score-badge');
                // Format points to show decimal only if needed
                const formattedPoints = pointsPerAnswer % 1 === 0 ? pointsPerAnswer.toString() : pointsPerAnswer.toFixed(1);
                scoreBadge.innerHTML = `<i class="fas fa-star mr-1"></i>+${formattedPoints}đ`;
                
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
        answerShown = true;        if (timerInterval) clearInterval(timerInterval);        if (DEBUG_MODE === 0 && timesUpPopupEl) {
            timesUpPopupEl.style.display = 'none';
            timesUpPopupEl.style.opacity = '0';
            timesUpPopupEl.style.animation = 'none'; // Stop any ongoing animations
            timeUpPopupVisible = false; // Reset flag when displaying answer
        }

        showAnswerBtn.disabled = true;
        showAnswerBtn.classList.add('opacity-50', 'cursor-not-allowed');
          let answerDisplayString = "";
        if (currentQuestionData.type_question === "Trắc nghiệm") {
            if (currentQuestionData.dap_an_dung) {
                const correctKeys = Array.isArray(currentQuestionData.dap_an_dung) 
                                    ? currentQuestionData.dap_an_dung 
                                    : [currentQuestionData.dap_an_dung];
                
                // Calculate points distribution for Round 1
                const totalPoints = 10;
                const numberOfCorrectAnswers = correctKeys.length;
                const pointsPerAnswer = Math.round((totalPoints / numberOfCorrectAnswers) * 10) / 10;
                const formattedPoints = pointsPerAnswer % 1 === 0 ? pointsPerAnswer.toString() : pointsPerAnswer.toFixed(1);
                
                answerDisplayString = `Đáp án: ${correctKeys.map(k => k.toUpperCase()).join(', ')}`;
                highlightCorrectAnswer();
            } else {
                answerDisplayString = "Không có đáp án cho câu này.";
            }
        } else if (currentQuestionData.type_question === "Lý thuyết tự luận" || currentQuestionData.type_question === "Câu hỏi hình ảnh") {
            if (typeof currentQuestionData.cau_tra_loi === 'string') {
                // For long answers, it might be better to just announce and refer to material
                answerDisplayString = `<span class="font-bold">Đáp án:</span> (Chi tiết trong tài liệu)`;
                 // If you want to show short answers:
                 // answerDisplayString = `<span class="font-bold">Đáp án:</span> ${currentQuestionData.cau_tra_loi}`;
            } else if (typeof currentQuestionData.cau_tra_loi === 'object' && currentQuestionData.cau_tra_loi !== null) {
                // Handle structured answers for "Câu hỏi hình ảnh"
                let structuredAnswer = "";
                for (const key in currentQuestionData.cau_tra_loi) {
                    structuredAnswer += `<p><strong>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> ${currentQuestionData.cau_tra_loi[key]}</p>`;
                }
                answerDisplayString = structuredAnswer; // This will be HTML
            }
             else {
                answerDisplayString = "Đáp án được trình bày bởi BGK/Tài liệu.";
            }
        } else if (currentQuestionData.type_question === "Thực hành") {
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
        // Enable navigation to next question
    }    // --- Navigation ---
    function nextQuestion() {
        navigationInProgress = true; // Set flag to prevent audio restart
        stopAllEvents();

        if (currentQuestionIndex < allQuestions.length - 1) {
            currentQuestionIndex++;
            renderSlide(allQuestions[currentQuestionIndex]);
        } else {
            window.location.href = 'menu.html';
        }
        
        // Clear navigation flag after a short delay to allow page rendering
        setTimeout(() => {
            navigationInProgress = false;
        }, 100);
    }

    function previousQuestion() {
        navigationInProgress = true; // Set flag to prevent audio restart
        stopAllEvents();

        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderSlide(allQuestions[currentQuestionIndex]);
        } else {
            // If we're at the first question, navigate back to menu.html
            window.location.href = 'menu.html';        }
    }

    //  Update Round Info Display
    function updateRoundInfoDisplay() {
        if (roundInfoDisplayEl && contestRoundsData.length > 0) {
            // Find Round 1 information
            const round1Info = contestRoundsData.find(round => round.vong === 1);
            if (round1Info) {
                roundInfoDisplayEl.innerHTML = `
                    <h3><i class="fas fa-trophy mr-2"></i>Vòng ${round1Info.vong}: ${round1Info.ten_vong}</h3>
                    <p>Thời gian trả lời: ${round1Info.thoi_gian_tra_loi} | Thang điểm: ${round1Info.thang_diem} điểm</p>
                `;
            } else {
                // Fallback if round info not found
                roundInfoDisplayEl.innerHTML = `
                    <h3><i class="fas fa-trophy mr-2"></i>Vòng 1: Chính sách pháp luật, PCCC và Y tế</h3>
                    <p>Thời gian trả lời: 30 giây/câu | Thang điểm: 10 điểm</p>
                `;
            }
        }
    }    // Load Data
    async function loadQuestions() {
        try {
            // Check if demo mode is enabled
            const isDemoMode = localStorage.getItem('demoMode') === 'true';
            
            // Load question sets configuration first
            const questionSetsResponse = await fetch('question_sets.json');
            if (!questionSetsResponse.ok) {
                throw new Error(`HTTP error loading question_sets.json! status: ${questionSetsResponse.status}`);
            }
            const questionSetsData = await questionSetsResponse.json();

            // Load Round 1 questions from vong1.json
            const response = await fetch('vong1.json');
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
            
            // Choose data source based on demo mode
            const sourceData = isDemoMode ? data.demo : data.vong_1;
            
            // Extract all questions from chosen data source
            let allAvailableQuestions = [];
            
            for (const categoryKey in sourceData) {
                const category = sourceData[categoryKey];
                for (const typeKey in category) {
                    if (Array.isArray(category[typeKey])) {
                        allAvailableQuestions = allAvailableQuestions.concat(category[typeKey]);
                    }
                }
            }

            if (isDemoMode) {
                // For demo mode, use all available demo questions
                allQuestions = allAvailableQuestions;
                console.log(`Demo mode: Loaded ${allQuestions.length} demo questions for vong1`);
            } else {
                // For normal mode, use question_sets.json configuration
                const vong1QuestionIds = questionSetsData.vong1?.["1"] || [];
                
                // Filter questions based on IDs defined in question_sets.json
                allQuestions = [];
                vong1QuestionIds.forEach(questionId => {
                    const question = allAvailableQuestions.find(q => q.id === questionId);
                    if (question) {
                        allQuestions.push(question);
                    } else {
                        console.warn(`Question with ID "${questionId}" not found in vong1.json`);
                    }
                });
                console.log(`Normal mode: Loaded ${allQuestions.length} questions for vong1 based on question_sets.json configuration`);
            }

            if (allQuestions.length > 0) {
                // Update round info display
                updateRoundInfoDisplay();
                renderSlide(allQuestions[currentQuestionIndex]);
                
                // Start glass shimmer timer if glass theme is enabled
                if (getThemeMode() === 'glass') {
                    startGlassShimmerTimer();
                }
            } else {
                progressTextEl.textContent = isDemoMode ? "Không tìm thấy câu hỏi demo nào." : "Không tìm thấy câu hỏi nào theo cấu hình trong question_sets.json.";
            }
        } catch (error) {
            console.error("Could not load questions:", error);
            progressTextEl.textContent = "Lỗi tải dữ liệu câu hỏi. Vui lòng kiểm tra file vong1.json, question_sets.json và console.";        }
    }

    // --- Emergency Exit Function ---
    function emergencyExitToPage3() {
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

    // Utility to stop all ongoing timers and audio without navigating away
    function stopAllEvents() {
        console.log('%c[STOP ALL EVENTS] Starting stopAllEvents()', 'color: red; font-weight: bold;');
        
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
            timesUpPopupEl.style.animation = 'none';
            timeUpPopupVisible = false; // Reset flag when stopping all events
        }
          sequenceInProgress = false;
        answerShown = false;
        navigationInProgress = false; // Reset navigation flag
        
        console.log('%c[STOP ALL EVENTS] stopAllEvents() completed', 'color: green; font-weight: bold;');
    }
    // --- Event Listeners ---
    startSequenceBtn.addEventListener('click', startQuestionSequence);
    showAnswerBtn.addEventListener('click', displayAnswer);    document.addEventListener('keydown', (e) => {
        console.log('Key pressed in app.js:', e.key); // Debug log
        
        // Disable arrow key navigation when time's up popup is visible
        if (timeUpPopupVisible && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
            e.preventDefault();
            console.log(`Navigation disabled: ${e.key} blocked while time's up popup is visible`);
            return;
        }
        
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            console.log('Arrow Right pressed - calling nextQuestion()');
            stopAllEvents();
            nextQuestion();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            console.log('Arrow Left pressed - calling previousQuestion()');
            stopAllEvents();
            previousQuestion();
        } else if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault(); 
            if (!startSequenceBtn.disabled) {
                startQuestionSequence();
            }
        } else if (e.key === 'Enter') {
            if (!showAnswerBtn.disabled && showAnswerBtn.style.display !== 'none') {
                e.preventDefault();
                displayAnswer();
            }        } else if (e.key === '0' && e.ctrlKey) { // Ctrl+0 for DEBUG mode 1
            e.preventDefault();
            DEBUG_MODE = 1;
            console.log('DEBUG MODE 1 activated: Timer disabled');
            progressTextEl.textContent = 'Timer disabled';
        } else if (e.key === '9' && e.ctrlKey) { // Ctrl+9 for DEBUG mode 2
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
        } else if (e.key === '1') { // Number 1 key to go to info page for round 1
            e.preventDefault();
            window.location.href = 'infovong1.html';
        }
    });    // --- Initialization ---
    loadQuestions();

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
});