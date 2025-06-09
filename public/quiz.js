class QuizApp {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.selectedAnswers = new Set();
        this.quizFile = null;
        

        // DOM Elements
        this.questionElement = document.getElementById('question');
        this.optionsContainer = document.getElementById('options-container');
        this.submitButton = document.getElementById('submit-btn');
        this.nextButton = document.getElementById('next-btn');
        this.scoreElement = document.getElementById('score');
        this.fileSelector = document.getElementById('quiz-file-selector');

        // Event Listeners
        this.submitButton.addEventListener('click', () => this.checkAnswer());
        this.nextButton.addEventListener('click', () => this.nextQuestion());
        this.fileSelector.addEventListener('change', (e) => this.loadQuizFile(e.target.value));

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

    async loadQuizFile(filename) {
        if (!filename) return;

        try {
            const response = await fetch(`/api/quiz/${filename}`);
            const content = await response.text();
            this.questions = this.parseMarkdownQuiz(content);
            this.currentQuestionIndex = 0;
            this.score = 0;
            this.updateScore();
            this.displayQuestion();
        } catch (error) {
            console.error('Error loading quiz file:', error);
        }
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
        this.updateScore();
        this.displayQuestion();
    }

    chooseNewQuiz() {
        this.fileSelector.value = '';
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.updateScore();
        this.questionElement.textContent = 'Select a quiz file to begin';
        this.optionsContainer.innerHTML = '';
        this.submitButton.style.display = 'none';
        this.nextButton.style.display = 'none';
    }
}

// Initialize the quiz app
document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
}); 