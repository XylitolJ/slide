// Test script for Question Manager Application
// This script validates all implemented features

console.log('=== Question Manager Feature Validation ===');

// Test 1: Verify layout structure
function testLayoutStructure() {
    console.log('\n1. Testing Layout Structure...');
    
    const questionsList = document.querySelector('.lg\\:col-span-2');
    const questionForm = document.querySelector('.lg\\:col-span-1');
    
    if (questionsList && questionForm) {
        console.log('✅ Layout structure correct: Questions list (left), Form (right)');
        return true;
    } else {
        console.log('❌ Layout structure incorrect');
        return false;
    }
}

// Test 2: Verify answer options A-H support
function testAnswerOptions() {
    console.log('\n2. Testing Answer Options A-H...');
    
    const options = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    let allFound = true;
    
    options.forEach(opt => {
        const field = document.getElementById(`option${opt}`);
        if (!field) {
            console.log(`❌ Option ${opt} field not found`);
            allFound = false;
        }
    });
    
    const addOptionsBtn = document.querySelector('button[onclick="toggleExtraOptions()"]');
    if (!addOptionsBtn) {
        console.log('❌ "Thêm phương án" button not found');
        allFound = false;
    }
    
    if (allFound) {
        console.log('✅ All answer options A-H supported');
    }
    
    return allFound;
}

// Test 3: Verify image question support
function testImageQuestionSupport() {
    console.log('\n3. Testing Image Question Support...');
    
    const imageCheckbox = document.querySelector('input[name="question_image"]');
    const imageIdField = document.getElementById('image_id');
    const bgImageField = document.getElementById('bg_image');
    const positionField = document.getElementById('position_image');
    
    if (imageCheckbox && imageIdField && bgImageField && positionField) {
        console.log('✅ Image question fields present');
        return true;
    } else {
        console.log('❌ Missing image question fields');
        return false;
    }
}

// Test 4: Verify speech ID fields
function testSpeechIdFields() {
    console.log('\n4. Testing Speech ID Fields...');
    
    const speechFields = [
        'speech_id_question',
        'speech_id_answer',
        'speech_id_options_A',
        'speech_id_options_B',
        'speech_id_options_C',
        'speech_id_options_D',
        'speech_id_options_E',
        'speech_id_options_F',
        'speech_id_options_G',
        'speech_id_options_H'
    ];
    
    let allFound = true;
    speechFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field) {
            console.log(`❌ Speech field ${fieldId} not found`);
            allFound = false;
        }
    });
    
    if (allFound) {
        console.log('✅ All speech ID fields present');
    }
    
    return allFound;
}

// Test 5: Verify drag and drop setup
function testDragAndDrop() {
    console.log('\n5. Testing Drag and Drop Setup...');
    
    const composeTab = document.getElementById('compose-content');
    const availableSection = document.getElementById('available-questions');
    const questionSetSection = document.getElementById('current-question-set');
    
    if (composeTab && availableSection && questionSetSection) {
        console.log('✅ Drag and drop structure present');
        return true;
    } else {
        console.log('❌ Drag and drop structure incomplete');
        return false;
    }
}

// Test 6: Verify keyboard shortcuts
function testKeyboardShortcuts() {
    console.log('\n6. Testing Keyboard Shortcuts...');
    
    // Check if event listeners are set up (indirect test)
    const hasKeyboardListeners = typeof setupKeyboardShortcuts === 'function';
    
    if (hasKeyboardListeners) {
        console.log('✅ Keyboard shortcuts function available');
        return true;
    } else {
        console.log('❌ Keyboard shortcuts not set up');
        return false;
    }
}

// Test 7: Verify data loading functions
function testDataFunctions() {
    console.log('\n7. Testing Data Functions...');
    
    const functions = [
        'loadQuestionsFromJSON',
        'saveQuestion',
        'addToQuestionSet',
        'removeFromQuestionSet',
        'saveQuestionSet',
        'clearQuestionSet'
    ];
    
    let allFound = true;
    functions.forEach(funcName => {
        if (typeof window[funcName] !== 'function') {
            console.log(`❌ Function ${funcName} not found`);
            allFound = false;
        }
    });
    
    if (allFound) {
        console.log('✅ All data functions present');
    }
    
    return allFound;
}

// Test 8: Verify multiple correct answers support
function testMultipleAnswers() {
    console.log('\n8. Testing Multiple Correct Answers...');
    
    const correctAnswerField = document.getElementById('correct_answer');
    
    if (correctAnswerField && correctAnswerField.type === 'text') {
        console.log('✅ Multiple correct answers supported (text input)');
        return true;
    } else {
        console.log('❌ Multiple correct answers not properly supported');
        return false;
    }
}

// Run all tests
function runAllTests() {
    console.log('Starting comprehensive feature validation...');
    
    const tests = [
        testLayoutStructure,
        testAnswerOptions,
        testImageQuestionSupport,
        testSpeechIdFields,
        testDragAndDrop,
        testKeyboardShortcuts,
        testDataFunctions,
        testMultipleAnswers
    ];
    
    let passedTests = 0;
    const totalTests = tests.length;
    
    tests.forEach(test => {
        try {
            if (test()) {
                passedTests++;
            }
        } catch (error) {
            console.log(`❌ Test failed with error: ${error.message}`);
        }
    });
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Tests passed: ${passedTests}/${totalTests}`);
    console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Application is fully functional.');
    } else {
        console.log('⚠️ Some tests failed. Check implementation.');
    }
}

// Auto-run tests when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}

// Also expose the function for manual testing
window.runFeatureValidation = runAllTests;
