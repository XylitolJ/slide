document.addEventListener('DOMContentLoaded', () => {    // URL Parameter handling for direct question access
    function getUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            questionId: urlParams.get('questionId'),
            category: urlParams.get('category'),
            subcategory: urlParams.get('subcategory'),
            autoStart: urlParams.get('autoStart') === 'true'
        };
    }

    // Parse URL parameters for selected question set from question_sets.json
    function getSelectedSet() {
        const params = new URLSearchParams(window.location.search);
        const setParam = params.get('set');
        
        // If no set parameter, return null (will load all questions)
        return setParam;
    }    // Function to find question by ID
    function findQuestionById(questionId) {
        if (!allQuestions || !questionId) return null;
        
        return allQuestions.find(q => q.id === questionId);
    }

    // DOM Elements
    const slideContainer = document.getElementById('slideContainer');
    // Header elements
    const headerEl = document.querySelector('.header');    
    const questionNumberEl = document.getElementById('newQuestionNumber');
    const questionCategoryEl = document.getElementById('newQuestionCategory');
    const timerCircleEl = document.getElementById('timerProgress');
    const timerTextEl = document.getElementById('timer');
    // Main content elements
    const questionSectionEl = document.getElementById('questionSection'); 
    const questionTextContentEl = document.getElementById('questionTextContent');
    const questionDisplayAreaEl = document.getElementById('questionDisplayArea');    // Footer elements
    const footerEl = document.querySelector('.footer'); 
    const progressTextEl = document.getElementById('progressText');
    const startSequenceBtn = document.getElementById('startSequenceBtn');
    const footerProgressBarEl = document.getElementById('footerProgressBar');
    const roundInfoDisplayEl = document.getElementById('roundInfoDisplay');const DELAY_NO_SPEECH_ANSWER = 1000; // ms to wait after showing answer if no speech
    const USE_SPEECH = false; // Disable speech functionality for Round 3
    const DEBUG_MODE = false; // Set to true to disable timer and auto-progression
    const DELAY_NO_SPEECH_QUESTION = 500; // ms to wait if no speech for question
    
    // THEME CONFIGURATION - Global variable to control header/footer theme
    // Options: 'default', 'category', 'round'
    const THEME_MODE = 'round'; // Change this to switch between theme modes

    // Popup elements
    const timesUpPopupEl = document.getElementById('timesUpPopup') || { style: { display: 'none', opacity: '0' } };    // State variables
    let allQuestions = [];
    let contestRoundsData = []; // To store data from quy_che_thi.cac_vong_thi
    let currentRound = 'vong3'; // Default round for vong3.html
    let currentQuestionIndex = 0;
    let currentQuestionData = null;let timerInterval;
    let timeLeft = 0; // Will be set per question
    const DEFAULT_TIME_PER_QUESTION = 300; // Default 5 minutes for Round 3 practical exams
    let sequenceInProgress = false;
    let navigationInProgress = false; // Add flag to prevent audio restart during navigation// Background styles for cleanup purposes only
    const backgroundStyles = [
        'bg-default', 'bg-abstract', 'bg-wave', 'bg-svg-pattern-1', 'bg-svg-pattern-2', 'bg-svg-pattern-3'
    ];    // --- Audio functions removed for Round 3 ---
    // No audio functionality needed for practical examination round    // --- Emergency Exit Function ---
    function emergencyExitToPage3() {
        console.log('Emergency exit function called');
        
        // Clear all timers
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        // Reset all flags
        sequenceInProgress = false;
        
        // Navigate to page3.html
        console.log('Navigating to page3.html');
        window.location.href = 'page3.html';
    }// Utility to stop all ongoing timers without audio (Round 3 doesn't use audio)
    function stopAllEvents() {
        console.log('%c[STOP ALL EVENTS] Starting stopAllEvents() in app3.js', 'color: red; font-weight: bold;');
        
        if (timerInterval) {
            console.log('%c[STOP ALL EVENTS] Clearing timer interval', 'color: red;');
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        if (timesUpPopupEl) {
            timesUpPopupEl.style.display = 'none';
            timesUpPopupEl.style.opacity = '0';
            timesUpPopupEl.style.animation = 'none';
        }
        sequenceInProgress = false;
        navigationInProgress = false; // Reset navigation flag
        
        console.log('%c[STOP ALL EVENTS] stopAllEvents() completed in app3.js', 'color: green; font-weight: bold;');    }

    // --- UI Updates & Animations ---
    function animateElement(element, animationClass) {
        if (element) {
            const elementName = element.id || element.className.split(' ')[0] || 'unknownElement';
            console.log(`animateElement: Called for ${elementName} with animation class ${animationClass}`);

            // 1. Remove initial hidden class
            element.classList.remove('u-hidden-initially');

            // 2. Add the animation class
            element.classList.add(animationClass);

            // 3. Make sure element is visible
            element.style.opacity = '1';
            element.style.visibility = 'visible';
            element.style.display = 'block';
        }    }

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
    };

    // Modified getThemeClass to use override if available
    function getThemeClassWithOverride(category) {
        const themeMode = window.THEME_MODE_OVERRIDE || THEME_MODE;
        switch (themeMode) {
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
            // Remove old theme classes for backward compatibility
            'theme-default', 'theme-medical', 'theme-fire', 'theme-safety'        ];
        // Apply theme to slideContainer, CSS will handle header/footer specifics
        if (slideContainer) {
            slideContainer.classList.remove(...allClasses); // Remove all theme classes
            slideContainer.classList.add(themeClass); // Add the new theme class
        }
    }

    function renderSlide(questionData) {
        console.log('--- renderSlide START ---', questionData);
        currentQuestionData = questionData;
        sequenceInProgress = false;

        // Function to apply background image with gradient or stripes overlay
        const applyBgImage = (bgImage, style) => {
            if (slideContainer) {
                // Clear any existing background styles
                slideContainer.classList.remove(...backgroundStyles);
                slideContainer.style.backgroundImage = '';
                slideContainer.classList.remove('bg-gradient-overlay', 'bg-stripes-overlay');
                
                // Convert Windows path to web path
                const webPath = bgImage.replace(/\\/g, '/');
                
                if (style === 'gradient') {
                    // Apply gradient overlay with the specified image
                    slideContainer.style.backgroundImage = `linear-gradient(0deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3)), url('${webPath}')`;
                } else if (style === 'stripes') {
                    // Apply diagonal stripes overlay with the specified image
                    slideContainer.style.backgroundImage = `linear-gradient(45deg,
                        rgba(245, 158, 11, 0.7) 0%,
                        rgba(245, 158, 11, 0.7) 33.33%,
                        rgba(255, 255, 255, 0.7) 33.33%,
                        rgba(255, 255, 255, 0.7) 66.66%,
                        rgba(245, 158, 11, 0.7) 66.66%,
                        rgba(245, 158, 11, 0.7) 100%),
                        url('${webPath}')`;
                }
                
                slideContainer.style.backgroundSize = 'cover';
                slideContainer.style.backgroundPosition = 'center';
                slideContainer.style.backgroundRepeat = 'no-repeat';
            }
        };        // Apply background based on bg_image and bg_image_overlay properties
        if (slideContainer) {
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
        }// Reset UI state
        progressTextEl.textContent = '';
        startSequenceBtn.disabled = false;
        startSequenceBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'speaking-indicator');
        
        timesUpPopupEl.style.display = 'none';
        timesUpPopupEl.style.opacity = '0';

        // Update header
        if (questionNumberEl) questionNumberEl.textContent = currentQuestionIndex + 1;
        if (questionCategoryEl) questionCategoryEl.textContent = questionData.category || 'Không có danh mục';
        applyTheme(questionData.category);
 
        // Update footer progress bar
        if (footerProgressBarEl) footerProgressBarEl.style.width = `${((currentQuestionIndex + 1) / allQuestions.length) * 100}%`;        // Update footer round information
        if (roundInfoDisplayEl && contestRoundsData.length > 0) {
            // Since this is app3.js for Round 3, always show Round 3 info
            const round3 = contestRoundsData.find(r => r.vong === 3);
            if (round3) {
                roundInfoDisplayEl.innerHTML = `
                    <h3><i class="fas fa-trophy mr-2"></i>Vòng ${round3.vong}: ${round3.ten_vong}</h3>
                    <p>${round3.cau_hoi_phan_bo} | Thời gian chuẩn bị: ${round3.thoi_gian_chuan_bi} | Thang điểm: ${round3.thang_diem} điểm</p>
                `;
            } else {
                roundInfoDisplayEl.innerHTML = ''; // Clear if Round 3 not found
            }
        }
        
        // Set question text
        if (questionTextContentEl) {
            questionTextContentEl.textContent = questionData.cau_hoi || 'Không có nội dung câu hỏi';
            // Make sure the question text is visible
            questionTextContentEl.style.display = 'block';
            questionTextContentEl.style.visibility = 'visible';
            questionTextContentEl.style.opacity = '1';
        }

        // Set timer
        timeLeft = questionData.time_per_question || DEFAULT_TIME_PER_QUESTION;
        if (timerTextEl) timerTextEl.textContent = timeLeft;

        // Reset timer circle
        if (timerCircleEl) {
            timerCircleEl.style.strokeDasharray = `${2 * Math.PI * 45}`;
            timerCircleEl.style.strokeDashoffset = '0';
        }

        // For Round 3 practical questions, show the question section immediately
        // since there are no answer options to reveal sequentially
        if (questionSectionEl) {
            questionSectionEl.classList.remove('u-hidden-initially');
            questionSectionEl.style.display = 'block';
            questionSectionEl.style.opacity = '1';
            questionSectionEl.style.visibility = 'visible';
        }

        console.log('--- renderSlide END ---');
    }

    // --- Timer Logic ---
    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        
        const totalTime = timeLeft;
        const circumference = 2 * Math.PI * 45; // r=45% from CSS
        
        timerInterval = setInterval(() => {
            timeLeft--;
            
            if (timerTextEl) {
                // Display minutes:seconds format for long timers
                if (timeLeft >= 60) {
                    const minutes = Math.floor(timeLeft / 60);
                    const seconds = timeLeft % 60;
                    timerTextEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                } else {
                    timerTextEl.textContent = timeLeft;
                }
            }
            
            // Update progress circle
            if (timerCircleEl) {
                const progress = (totalTime - timeLeft) / totalTime;
                const offset = circumference * progress;
                timerCircleEl.style.strokeDashoffset = offset;
            }
              if (timeLeft <= 0) {
                clearInterval(timerInterval);
                
                if (!DEBUG_MODE) {
                    // Show time's up overlay
                    timesUpPopupEl.style.display = 'block';
                    timesUpPopupEl.style.opacity = '1';
                    
                    // Play timer audio for 5-minute practical exams
                    if (USE_SPEECH) {
                        playAudio('speech/300s.mp3'); // 5-minute timer audio
                    }
                } else {
                    console.log("DEBUG MODE: Timer reached 0");
                }
            }
        }, 1000);
    }    // --- Main Sequence Logic ---
    async function startQuestionSequence() {
        console.log('--- startQuestionSequence START ---');
        if (sequenceInProgress) {
            console.log('startQuestionSequence: Aborted - sequenceInProgress:', sequenceInProgress);
            return;
        }
        sequenceInProgress = true;        startSequenceBtn.disabled = true;
        startSequenceBtn.classList.add('opacity-50', 'cursor-not-allowed');

        // Apply background overlay when question sequence starts
        applyBackgroundOverlay();

        // 1. Show Question (no audio for Round 3)
        if (questionSectionEl) questionSectionEl.classList.remove('u-hidden-initially');
        animateElement(questionSectionEl, 'question-appear');        // 2. Start Timer immediately (for practical questions, this is the time to complete the task)
        if (DEBUG_MODE || timeLeft > 0) {
            startTimer();
        }
        
        startSequenceBtn.classList.remove('speaking-indicator');
        sequenceInProgress = false;
    }// --- Navigation ---
    function nextQuestion() {
        navigationInProgress = true; // Set flag to prevent audio restart
        stopAllEvents();
        if (currentQuestionIndex < allQuestions.length - 1) {
            currentQuestionIndex++;
            renderSlide(allQuestions[currentQuestionIndex]);
        } else {
            // If we're at the last question, navigate back to thuchanh.html
            window.location.href = 'thuchanh.html';
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
            // If we're at the first question, navigate back to thuchanh.html
            window.location.href = 'thuchanh.html';
        }
        
        // Clear navigation flag after a short delay to allow page rendering
        setTimeout(() => {
            navigationInProgress = false;
        }, 100);
    }// --- Update Round Info Display ---
    function updateRoundInfoDisplay() {
        if (roundInfoDisplayEl && contestRoundsData.length > 0) {
            // For Round 3
            const round3 = contestRoundsData.find(r => r.vong === 3);
            if (round3) {
                roundInfoDisplayEl.innerHTML = `
                    <h3><i class="fas fa-trophy mr-2"></i>Vòng ${round3.vong}: ${round3.ten_vong}</h3>
                    <p>${round3.cau_hoi_phan_bo} | Thời gian chuẩn bị: ${round3.thoi_gian_chuan_bi} | Thang điểm: ${round3.thang_diem} điểm</p>
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
            const questionSetsData = await questionSetsResponse.json();
            console.log('Loaded question_sets.json:', questionSetsData);

            // Load Round 3 questions from vong3.json
            const response = await fetch('vong3.json');
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
            }            // Extract all questions from vong3.json structure
            const vong3Data = data.vong_3;
            let allAvailableQuestions = [];
            
            // Create a lookup map for questions by ID
            const questionLookup = {};
            
            // Process Y tế (Medical) category - only "thuc_hanh" questions
            if (vong3Data.y_te && vong3Data.y_te.thuc_hanh) {
                vong3Data.y_te.thuc_hanh.forEach(q => {
                    questionLookup[q.id] = q;
                    allAvailableQuestions.push(q);
                });
            }
            
            // Process PCCC category - "ly_thuyet_thuc_hanh" questions  
            if (vong3Data.phong_chay_chua_chay && vong3Data.phong_chay_chua_chay.ly_thuyet_thuc_hanh) {
                vong3Data.phong_chay_chua_chay.ly_thuyet_thuc_hanh.forEach(q => {
                    questionLookup[q.id] = q;
                    allAvailableQuestions.push(q);
                });
            }

            // Get vong3 configuration from question_sets.json
            const vong3Config = questionSetsData.vong3;
            if (!vong3Config) {
                throw new Error('Vong3 configuration not found in question_sets.json');
            }

            // Build questions array based on question_sets.json configuration
            allQuestions = [];
            
            // Add Y tế questions in configured order
            if (vong3Config.y_te && Array.isArray(vong3Config.y_te)) {
                vong3Config.y_te.forEach(questionId => {
                    const question = questionLookup[questionId];
                    if (question) {
                        allQuestions.push(question);
                    } else {
                        console.warn(`Y tế question with ID ${questionId} not found in vong3.json`);
                    }
                });
            }
            
            // Add PCCC questions in configured order
            if (vong3Config.pccc && Array.isArray(vong3Config.pccc)) {
                vong3Config.pccc.forEach(questionId => {
                    const question = questionLookup[questionId];
                    if (question) {
                        allQuestions.push(question);
                    } else {
                        console.warn(`PCCC question with ID ${questionId} not found in vong3.json`);
                    }
                });
            }            if (allQuestions.length > 0) {
                console.log(`Loaded ${allQuestions.length} questions for vong3 based on question_sets.json configuration`);
                
                // Check if we need to load a specific question from URL parameters
                const urlParams = getUrlParameters();
                if (urlParams.questionId) {
                    const specificQuestion = findQuestionById(urlParams.questionId);
                    if (specificQuestion) {
                        // Find the index of the specific question using ID
                        currentQuestionIndex = allQuestions.findIndex(q => q.id === urlParams.questionId);
                        if (currentQuestionIndex === -1) {
                            currentQuestionIndex = 0;
                        }
                        
                        // Update progress text for direct question loading
                        progressTextEl.textContent = `Đã tải câu hỏi ${urlParams.questionId}. ${urlParams.autoStart ? 'Tự động bắt đầu...' : 'Nhấn "Bắt đầu" để bắt đầu.'}`;
                        
                        // Auto-start if requested
                        if (urlParams.autoStart) {
                            setTimeout(() => {
                                startQuestionSequence();
                            }, 1000);
                        }
                    } else {
                        progressTextEl.textContent = `Không tìm thấy câu hỏi ${urlParams.questionId}. Hiển thị câu hỏi đầu tiên.`;
                    }
                } else {
                    progressTextEl.textContent = `Đã tải ${allQuestions.length} câu hỏi thực hành. Nhấn "Bắt đầu" để bắt đầu.`;
                }
                
                // Update round info display
                updateRoundInfoDisplay();
                renderSlide(allQuestions[currentQuestionIndex]);
                
                // Ensure the question content is visible for Round 3 practical questions
                if (questionSectionEl) {
                    questionSectionEl.style.display = 'block';
                    questionSectionEl.style.opacity = '1';
                    questionSectionEl.style.visibility = 'visible';
                }
            } else {
                progressTextEl.textContent = "Không tìm thấy câu hỏi phù hợp theo cấu hình trong question_sets.json.";
            }        } catch (error) {
            console.error("Could not load questions:", error);
            progressTextEl.textContent = "Lỗi tải dữ liệu câu hỏi. Vui lòng kiểm tra file vong3.json, question_sets.json và console.";
        }
    }
    
    startSequenceBtn.addEventListener('click', startQuestionSequence);

    document.addEventListener('keydown', (e) => {
        console.log('Key pressed in app3.js:', e.key); // Debug log
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            console.log('Arrow Right pressed - navigating to thuchanh.html');
            stopAllEvents();
            window.location.href = 'thuchanh.html';
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            console.log('Arrow Left pressed - navigating to thuchanh.html');
            stopAllEvents();
            window.location.href = 'thuchanh.html';
        } else if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            if (!startSequenceBtn.disabled) {
                startQuestionSequence();
            }
        } else if (e.key.toLowerCase() === 'd' && e.ctrlKey) { // Ctrl+D to toggle debug
            e.preventDefault();
            console.log("Debug mode toggle attempted. Reload page if DEBUG_MODE constant was changed.");
        } else if (e.key.toLowerCase() === 'q') { // Q key for emergency exit
            e.preventDefault();
            console.log('Q key pressed - Emergency exit activated');
            emergencyExitToPage3();
        } else if (e.key === '3') { // Number 3 key to go to info page for round 3
            e.preventDefault();
            window.location.href = 'infovong3.html';
        }
    });

    // --- Initialization ---
    loadQuestions();
});