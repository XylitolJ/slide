document.addEventListener('DOMContentLoaded', () => {    // URL Parameter handling for direct question access
    function getUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            questionId: urlParams.get('questionId'),
            category: urlParams.get('category'),
            subcategory: urlParams.get('subcategory'),
            autoStart: urlParams.get('autoStart') === 'true'
        };
    }// Function to find question by ID and category
    function findQuestionById(questionId, category, subcategory) {
        if (!allQuestions || !questionId) return null;
        
        return allQuestions.find(q => {
            const matchesId = q.cau_hoi_so.toString() === questionId.toString();
            const matchesCategory = category ? q.category.toLowerCase().includes(category.toLowerCase()) : true;
            const matchesSubcategory = subcategory ? q.subcategory.toLowerCase().includes(subcategory.toLowerCase()) : true;
            
            return matchesId && matchesCategory && matchesSubcategory;
        });
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
    const questionDisplayAreaEl = document.getElementById('questionDisplayArea');
    // Footer elements
    const footerEl = document.querySelector('.footer'); 
    const progressTextEl = document.getElementById('progressText');
    const startSequenceBtn = document.getElementById('startSequenceBtn');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const backToThuchanhBtn = document.getElementById('backToThuchanhBtn');
    const footerProgressBarEl = document.getElementById('footerProgressBar');
    const roundInfoDisplayEl = document.getElementById('roundInfoDisplay');
    const DELAY_NO_SPEECH_ANSWER = 1000; // ms to wait after showing answer if no speech
    const USE_SPEECH = true; // Enable speech functionality
    const DEBUG_MODE = false; // Set to true to disable timer and auto-progression
    const DELAY_NO_SPEECH_QUESTION = 500; // ms to wait if no speech for question

    // Popup elements
    const timesUpPopupEl = document.getElementById('timesUpPopup') || { style: { display: 'none', opacity: '0' } };

    // State variables
    let allQuestions = [];
    let contestRoundsData = []; // To store data from quy_che_thi.cac_vong_thi
    let currentQuestionIndex = 0;
    let currentQuestionData = null;
    let timerInterval;
    let timeLeft = 0; // Will be set per question
    const DEFAULT_TIME_PER_QUESTION = 300; // Default 5 minutes for Round 3 practical exams
    let audioContext;
    let currentAudio = null;
    let sequenceInProgress = false;    // Background styles for cleanup purposes only
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
        }    }

    // --- Emergency Exit Function ---
    function emergencyExitToPage3() {
        console.log('Emergency exit function called');
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
        
        // Navigate to page3.html
        console.log('Navigating to page3.html');
        window.location.href = 'page3.html';
    }

    // --- Audio Playback ---
    async function playAudio(filePath, onEndCallback) {
        if (!USE_SPEECH || !audioContext || !filePath) {
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
        }
    }

    function getThemeClass(category) {
        if (!category) return 'theme-default';
        const normalizedCategory = category.toLowerCase();
        if (normalizedCategory.includes('y tế') || normalizedCategory.includes('sơ cấp cứu')) {
            return 'theme-medical';
        } else if (normalizedCategory.includes('phòng cháy') || normalizedCategory.includes('pccc')) {
            return 'theme-fire';
        } else if (normalizedCategory.includes('kỹ thuật') || normalizedCategory.includes('an toàn')) {
            return 'theme-safety';
        } else {
            return 'theme-default';
        }
    }

    function applyTheme(category) {
        const themeClass = getThemeClass(category);
        
        // Remove all existing theme classes
        slideContainer.classList.remove('theme-default', 'theme-medical', 'theme-fire', 'theme-safety');
        
        // Add the new theme class
        slideContainer.classList.add(themeClass);
    }    function renderSlide(questionData) {
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
                    slideContainer.style.backgroundImage = `linear-gradient(to bottom right, rgba(245, 158, 11, 0.7), rgba(255, 255, 255, 0.7)), url('${webPath}')`;
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
        };

        // Apply background based on bg_image property
        if (slideContainer) {
            if (questionData.bg_image) {
                // Use bg_image from JSON data and alternate between gradient and stripes
                const imageStyle = currentQuestionIndex % 2 === 0 ? 'gradient' : 'stripes';
                applyBgImage(questionData.bg_image, imageStyle);
            } else {
                // Fallback to default background if no bg_image is specified
                slideContainer.classList.remove(...backgroundStyles);
                slideContainer.style.backgroundImage = '';
                slideContainer.classList.add('bg-default');
            }
        }

        // Reset UI state
        progressTextEl.textContent = '';
        nextQuestionBtn.style.display = 'none';
        startSequenceBtn.disabled = false;
        startSequenceBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'speaking-indicator');
        
        timesUpPopupEl.style.display = 'none';
        timesUpPopupEl.style.opacity = '0';

        // Update header
        if (questionNumberEl) questionNumberEl.textContent = currentQuestionIndex + 1;
        if (questionCategoryEl) questionCategoryEl.textContent = questionData.category || 'Không có danh mục';
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
                    <p>Thời gian thực hiện: ${currentRound.thoi_gian_tra_loi} | Thang điểm: ${currentRound.thang_diem} điểm</p>
                `;            } else {
                roundInfoDisplayEl.innerHTML = ''; // Clear if no round info found (should not happen)
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
                
                // Show next question button
                nextQuestionBtn.style.display = 'inline-block';
                nextQuestionBtn.disabled = false;
                nextQuestionBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }, 1000);
    }

    // --- Main Sequence Logic ---
    async function startQuestionSequence() {
        console.log('--- startQuestionSequence START ---');
        if (sequenceInProgress) {
            console.log('startQuestionSequence: Aborted - sequenceInProgress:', sequenceInProgress);
            return;
        }
        sequenceInProgress = true;
        initAudio();

        startSequenceBtn.disabled = true;
        startSequenceBtn.classList.add('opacity-50', 'cursor-not-allowed', 'speaking-indicator');

        // 1. Show Question
        if (questionSectionEl) questionSectionEl.classList.remove('u-hidden-initially');
        animateElement(questionSectionEl, 'question-appear');

        // 2. Speak Question if audio available
        if (USE_SPEECH && currentQuestionData.speech_id_question) {
            await playAudio(`speech/${currentQuestionData.speech_id_question}`);
        } else {
            await new Promise(r => setTimeout(r, DELAY_NO_SPEECH_QUESTION));
        }

        // 3. Start Timer (for practical questions, this is the time to complete the task)
        if (DEBUG_MODE || timeLeft > 0) {
            startTimer();
        } else if (!DEBUG_MODE && timeLeft <= 0) { 
            nextQuestionBtn.style.display = 'inline-block'; 
            nextQuestionBtn.disabled = false;
            nextQuestionBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        
        startSequenceBtn.classList.remove('speaking-indicator');
        sequenceInProgress = false;
    }

    // --- Navigation ---
    function nextQuestion() {
        if (currentAudio && currentAudio.source) { // Stop any ongoing audio
            currentAudio.source.stop();
            currentAudio.source.disconnect();
            currentAudio = null;
        }
        if (timerInterval) clearInterval(timerInterval);        if (currentQuestionIndex < allQuestions.length - 1) {
            currentQuestionIndex++;
            renderSlide(allQuestions[currentQuestionIndex]);
        } else {
            // If we're at the last question, navigate back to page3.html
            window.location.href = 'page3.html';
        }
    }

    function previousQuestion() {
        if (currentAudio && currentAudio.source) {
            currentAudio.source.stop();
            currentAudio.source.disconnect();
            currentAudio = null;
        }
        if (timerInterval) clearInterval(timerInterval);

        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderSlide(allQuestions[currentQuestionIndex]);
        } else {
            // If we're at the first question, navigate back to page3.html
            window.location.href = 'page3.html';
        }
    }

    // --- Update Round Info Display ---
    function updateRoundInfoDisplay() {
        if (roundInfoDisplayEl && contestRoundsData.length > 0) {
            // For Round 3
            const round3 = contestRoundsData.find(r => r.vong === 3);
            if (round3) {
                roundInfoDisplayEl.innerHTML = `
                    <h3><i class="fas fa-trophy mr-2"></i>Vòng ${round3.vong}: ${round3.ten_vong}</h3>
                    <p>Thời gian thực hiện: ${round3.thoi_gian_tra_loi} | Thang điểm: ${round3.thang_diem} điểm</p>
                `;
            }
        }
    }    // --- Load Data ---
    async function loadQuestions() {
        try {
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
                    }                }
            } catch (rulesError) {
                console.warn("Could not load contest rules:", rulesError);
            }            // Extract questions from vong3.json structure
            const vong3Data = data.vong_3;
            allQuestions = [];
            
            for (const categoryKey in vong3Data) {
                const category = vong3Data[categoryKey];
                for (const typeKey in category) {
                    if (Array.isArray(category[typeKey])) {
                        allQuestions = allQuestions.concat(category[typeKey]);
                    }
                }
            }            if (allQuestions.length > 0) {                // Check if we need to load a specific question from URL parameters
                const urlParams = getUrlParameters();
                if (urlParams.questionId) {
                    // Show back button when coming from thuchanh.html
                    if (backToThuchanhBtn) {
                        backToThuchanhBtn.style.display = 'block';
                    }
                      const specificQuestion = findQuestionById(urlParams.questionId, urlParams.category, urlParams.subcategory);
                    if (specificQuestion) {
                        // Find the index of the specific question using both ID and category/subcategory
                        currentQuestionIndex = allQuestions.findIndex(q => {
                            const matchesId = q.cau_hoi_so.toString() === urlParams.questionId.toString();
                            const matchesCategory = urlParams.category ? q.category.toLowerCase().includes(urlParams.category.toLowerCase()) : true;
                            const matchesSubcategory = urlParams.subcategory ? q.subcategory.toLowerCase().includes(urlParams.subcategory.toLowerCase()) : true;
                            
                            return matchesId && matchesCategory && matchesSubcategory;
                        });
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
                }        } else {
            progressTextEl.textContent = "Không tìm thấy câu hỏi nào trong file vong3.json.";
        }
    } catch (error) {
        console.error("Could not load questions:", error);
        progressTextEl.textContent = "Lỗi tải dữ liệu câu hỏi. Vui lòng kiểm tra file vong3.json và console.";    }
    
    startSequenceBtn.addEventListener('click', startQuestionSequence);
    nextQuestionBtn.addEventListener('click', nextQuestion);
    
    // Back to thuchanh.html button functionality    if (backToThuchanhBtn) {
        backToThuchanhBtn.addEventListener('click', () => {
            window.location.href = 'thuchanh.html';
        });
    }    document.addEventListener('keydown', (e) => {
        console.log('Key pressed:', e.key); // Debug log
        if (e.key === 'ArrowRight') {
            // Phím mũi tên phải: next câu hỏi hoặc về page3.html nếu ở câu cuối
            e.preventDefault();
            nextQuestion();        } else if (e.key === 'ArrowLeft') {
            // Phím mũi tên trái: previous câu hỏi hoặc về page3.html nếu ở câu đầu
            e.preventDefault();
            previousQuestion();
        } else if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            if (!startSequenceBtn.disabled) {
                startQuestionSequence();
            }
        } else if (e.key === 'Enter') {
            if (!nextQuestionBtn.disabled && nextQuestionBtn.style.display !== 'none') {
                e.preventDefault();
                nextQuestion();
            }
        } else if (e.key.toLowerCase() === 'd' && e.ctrlKey) { // Ctrl+D to toggle debug
            e.preventDefault();
            console.log("Debug mode toggle attempted. Reload page if DEBUG_MODE constant was changed.");        } else if (e.key.toLowerCase() === 'q') { // Q key for emergency exit
            e.preventDefault();
            console.log('Q key pressed - Emergency exit activated');
            emergencyExitToPage3();
        }
    });

    // --- Initialization ---
    loadQuestions();
});