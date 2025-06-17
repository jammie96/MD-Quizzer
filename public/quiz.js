class QuizApp {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.selectedAnswers = new Set();
        this.quizFile = null;
        this.isQuizStarted = false;
        this.uploadedFiles = new Map(); // Store uploaded files with their names
        this.isLoading = false;
        

        // DOM Elements
        this.questionElement = document.getElementById('question');
        this.optionsContainer = document.getElementById('options-container');
        this.submitButton = document.getElementById('submit-btn');
        this.nextButton = document.getElementById('next-btn');
        this.scoreElement = document.getElementById('score');
        this.fileUpload = document.getElementById('quiz-file-upload');
        this.fileUploadContainer = document.querySelector('.file-upload');
        this.titleElement = document.querySelector('h1');

        // Create loading overlay
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.className = 'loading-overlay';
        this.loadingOverlay.style.display = 'none';
        this.loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <p class="loading-text">Loading Quiz...</p>
        `;
        document.body.appendChild(this.loadingOverlay);

        // Create main menu button
        this.mainMenuButton = document.createElement('button');
        this.mainMenuButton.id = 'main-menu-btn';
        this.mainMenuButton.textContent = 'Main Menu';
        this.mainMenuButton.style.display = 'none';
        this.mainMenuButton.addEventListener('click', () => this.returnToMainMenu());
        document.querySelector('.container').insertBefore(this.mainMenuButton, document.querySelector('.container').firstChild);

        // Create file history dropdown
        this.fileHistoryContainer = document.createElement('div');
        this.fileHistoryContainer.className = 'file-history';
        this.fileHistoryContainer.style.display = 'none';
        
        // Create welcome text
        this.welcomeText = document.createElement('p');
        this.welcomeText.className = 'welcome-text';
        this.welcomeText.textContent = 'Select a quiz file to begin';
        this.fileHistoryContainer.appendChild(this.welcomeText);

        this.fileHistorySelect = document.createElement('select');
        this.fileHistorySelect.id = 'file-history-select';
        this.fileHistorySelect.addEventListener('change', (e) => this.loadFromHistory(e.target.value));
        this.fileHistoryContainer.appendChild(this.fileHistorySelect);
        this.fileUploadContainer.appendChild(this.fileHistoryContainer);

        // Event Listeners
        this.submitButton.addEventListener('click', () => this.checkAnswer());
        this.nextButton.addEventListener('click', () => this.nextQuestion());
        this.fileUpload.addEventListener('change', (e) => this.handleFileUpload(e));

        // Hide buttons initially
        this.submitButton.style.display = 'none';
        this.nextButton.style.display = 'none';

        // Initialize
        this.loadAvailableQuizzes();
    }

    async loadAvailableQuizzes() {
        try {
            const response = await fetch('/api/quizzes');
            const quizzes = await response.json();
            
            quizzes
                .filter(quiz => quiz !== 'README.md') // Filter out README.md
                .forEach(quiz => {
                    const option = document.createElement('option');
                    option.value = quiz;
                    option.textContent = quiz.replace('.md', '');
                    this.fileSelector.appendChild(option);
                });
        } catch (error) {
            console.error('Error loading quizzes:', error);
        }
    }

    setLoading(isLoading) {
        this.isLoading = isLoading;
        document.body.style.cursor = isLoading ? 'wait' : 'default';
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = isLoading ? 'flex' : 'none';
        }
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            this.setLoading(true);
            const content = await this.readFileContent(file);
            this.uploadedFiles.set(file.name, content);
            this.updateFileHistory();
            await this.startQuiz(content, file.name);
        } catch (error) {
            console.error('Error reading file:', error);
            alert('Error reading the quiz file. Please make sure it\'s a valid quiz file.');
        } finally {
            this.setLoading(false);
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    parseMarkdownQuiz(content) {
        const questions = [];
        const lines = content.split('\n');
        let currentQuestion = null;
        let currentOptions = [];
        let currentCorrectAnswer = null;
        let isMultipleAnswer = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
    
            // Skip empty lines
            if (!line) continue;
    
            // Check if line is a question (starts with number and dot)
            if (/^\d+\./.test(line)) {
                // Save previous question if exists
                if (currentQuestion) {
                    questions.push({
                        question: currentQuestion,
                        options: currentOptions,
                        correctAnswer: currentCorrectAnswer,
                        isMultipleAnswer: isMultipleAnswer
                    });
                }
    
                // Start new question
                currentQuestion = line.replace(/^\d+\.\s*/, '');
                
                // Check if it's a multiple answer question
                isMultipleAnswer = /\(Select\s+TWO\)/i.test(currentQuestion);
                
                currentOptions = [];
                currentCorrectAnswer = null;
            }
            // Check if line is an option (starts with -)
            else if (line.startsWith('-')) {
                const option = line.replace(/^-\s*/, '');
                currentOptions.push(option);
            }
            // Check if line contains correct answer
            else if (line.includes('Correct answer:')) {
                const answer = line.match(/Correct answer: ([A-Z,\s]+)/)[1];
                currentCorrectAnswer = answer.split(',').map(a => a.trim());
                
                // If there's a comma in the answer, it's definitely multiple choice
                if (answer.includes(',')) {
                    isMultipleAnswer = true;
                }
            }
        }
    
        // Don't forget to add the last question
        if (currentQuestion) {
            questions.push({
                question: currentQuestion,
                options: currentOptions,
                correctAnswer: currentCorrectAnswer,
                isMultipleAnswer: isMultipleAnswer
            });
        }
    
        return questions;
    }

    displayQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.showQuizComplete();
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        this.questionElement.textContent = question.question;
        this.optionsContainer.innerHTML = '';

        // Add multiple answer indicator if needed
        if (question.isMultipleAnswer) {
            const indicator = document.createElement('div');
            indicator.className = 'multiple-answer-indicator';
            indicator.textContent = 'Select all that apply';
            this.optionsContainer.appendChild(indicator);
        }

        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = option;
            optionElement.addEventListener('click', () => this.selectAnswer(index));
            this.optionsContainer.appendChild(optionElement);
        });

        this.submitButton.style.display = 'block';
        this.nextButton.style.display = 'none';
        this.selectedAnswers.clear();
    }

    selectAnswer(index) {
        const question = this.questions[this.currentQuestionIndex];
        const options = this.optionsContainer.getElementsByClassName('option');
        const option = options[index];
        
        if (question.isMultipleAnswer) {
            // Toggle selection for multiple answer questions
            if (this.selectedAnswers.has(index)) {
                this.selectedAnswers.delete(index);
                option.classList.remove('selected');
            } else {
                this.selectedAnswers.add(index);
                option.classList.add('selected');
            }
        } else {
            // Single answer behavior
            for (let opt of options) {
                opt.classList.remove('selected');
            }
            this.selectedAnswers.clear();
            this.selectedAnswers.add(index);
            option.classList.add('selected');
        }
    }

    checkAnswer() {
        if (this.selectedAnswers.size === 0) return;

        const question = this.questions[this.currentQuestionIndex];
        const options = this.optionsContainer.getElementsByClassName('option');
        
        // Convert selected answers to letters (A, B, C, etc.)
        const selectedLetters = Array.from(this.selectedAnswers).map(index => 
            String.fromCharCode(65 + index)
        );
        
        let isCorrect;
        if (question.isMultipleAnswer) {
            // For multiple answer questions, all correct answers must be selected and no incorrect ones
            isCorrect = question.correctAnswer.length === selectedLetters.length &&
                question.correctAnswer.every(answer => selectedLetters.includes(answer));
        } else {
            // For single answer questions, just check if the selected answer is correct
            isCorrect = question.correctAnswer.includes(selectedLetters[0]);
        }

        // Mark all selected options
        this.selectedAnswers.forEach(index => {
            const isAnswerCorrect = question.correctAnswer.includes(String.fromCharCode(65 + index));
            options[index].classList.add(isAnswerCorrect ? 'correct' : 'incorrect');
        });

        // For multiple answer questions, also show unselected correct answers
        if (question.isMultipleAnswer) {
            question.correctAnswer.forEach(answer => {
                const index = answer.charCodeAt(0) - 65;
                if (!this.selectedAnswers.has(index)) {
                    options[index].classList.add('correct');
                }
            });
        }
        
        if (isCorrect) {
            this.score++;
            this.updateScore();
        }

        // Disable all options after submission
        Array.from(options).forEach(option => {
            option.style.pointerEvents = 'none';
        });

        this.submitButton.style.display = 'none';
        this.nextButton.style.display = 'block';
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        this.selectedAnswers.clear();
        this.displayQuestion();
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
    }

    showQuizComplete() {
        const totalQuestions = this.questions.length;
        const percentage = Math.round((this.score / totalQuestions) * 100);
        const hasPassed = percentage >= 70;
        
        this.questionElement.textContent = 'Quiz Complete!';
        this.optionsContainer.innerHTML = `
            <div class="completion-message">
                <h3>Your Results</h3>
                <p>Score: ${this.score} out of ${totalQuestions}</p>
                <p>Passing Score: 70%</p>
                <p>Percentage: ${percentage}%</p>
                <p class="result-status ${hasPassed ? 'passed' : 'failed'}">
                    ${hasPassed ? 'Congratulations! You Passed!' : 'Sorry, You Failed. Please try again.'}
                </p>
                <div class="completion-buttons">
                    <button id="reset-btn" class="reset-button">Try Again</button>
                    <button id="new-quiz-btn" class="new-quiz-button">Choose Another Quiz</button>
                </div>
            </div>
        `;

        // Add event listeners to the new buttons
        document.getElementById('reset-btn').addEventListener('click', () => this.resetQuiz());
        document.getElementById('new-quiz-btn').addEventListener('click', () => this.chooseNewQuiz());

        this.submitButton.style.display = 'none';
        this.nextButton.style.display = 'none';
    }

    resetQuiz() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.isQuizStarted = true;
        this.fileUploadContainer.style.display = 'none';
        this.mainMenuButton.style.display = 'block';
        this.updateScore();
        this.displayQuestion();
    }

    chooseNewQuiz() {
        this.returnToMainMenu();
    }

    returnToMainMenu() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.isQuizStarted = false;
        this.fileUploadContainer.style.display = 'block';
        this.mainMenuButton.style.display = 'none';
        this.updateScore();
        this.questionElement.textContent = '';
        this.optionsContainer.innerHTML = '';
        this.submitButton.style.display = 'none';
        this.nextButton.style.display = 'none';
        this.fileUpload.value = '';
        this.titleElement.textContent = 'AWS Quiz App';
        this.updateFileHistory();
    }

    async startQuiz(content, filename) {
        try {
            this.questions = this.parseMarkdownQuiz(content);
            this.currentQuestionIndex = 0;
            this.score = 0;
            this.updateScore();
            this.isQuizStarted = true;
            this.fileUploadContainer.style.display = 'none';
            this.mainMenuButton.style.display = 'block';
            this.titleElement.textContent = filename.replace('.md', '');
            this.displayQuestion();
        } catch (error) {
            console.error('Error starting quiz:', error);
            throw error;
        }
    }

    async loadFromHistory(filename) {
        if (!filename) return;
        const content = this.uploadedFiles.get(filename);
        if (content) {
            this.setLoading(true);
            try {
                await this.startQuiz(content, filename);
            } catch (error) {
                console.error('Error loading quiz from history:', error);
                alert('Error loading the quiz. Please try again.');
            } finally {
                this.setLoading(false);
            }
        }
    }

    updateFileHistory() {
        this.fileHistorySelect.innerHTML = '<option value="">Select a previous quiz</option>';
        this.uploadedFiles.forEach((content, filename) => {
            const option = document.createElement('option');
            option.value = filename;
            option.textContent = filename.replace('.md', '');
            this.fileHistorySelect.appendChild(option);
        });
        this.fileHistoryContainer.style.display = this.uploadedFiles.size > 0 ? 'block' : 'none';
    }
}

// Initialize the quiz app
document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
}); 