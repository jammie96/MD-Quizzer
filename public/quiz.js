class QuizApp {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.selectedAnswer = null;
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

        // Initialize
        this.loadAvailableQuizzes();
    }

    async loadAvailableQuizzes() {
        try {
            const response = await fetch('/api/quizzes');
            const quizzes = await response.json();
            
            quizzes.forEach(quiz => {
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
                        correctAnswer: currentCorrectAnswer
                    });
                }

                // Start new question
                currentQuestion = line.replace(/^\d+\.\s*/, '');
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
                const answer = line.match(/Correct answer: ([A-Z,]+)/)[1];
                currentCorrectAnswer = answer.split(',').map(a => a.trim());
            }
        }

        // Add last question
        if (currentQuestion) {
            questions.push({
                question: currentQuestion,
                options: currentOptions,
                correctAnswer: currentCorrectAnswer
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

        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = option;
            optionElement.addEventListener('click', () => this.selectAnswer(index));
            this.optionsContainer.appendChild(optionElement);
        });

        this.submitButton.style.display = 'block';
        this.nextButton.style.display = 'none';
        this.selectedAnswer = null;
    }

    selectAnswer(index) {
        const options = this.optionsContainer.getElementsByClassName('option');
        for (let option of options) {
            option.classList.remove('selected');
        }
        options[index].classList.add('selected');
        this.selectedAnswer = index;
    }

    checkAnswer() {
        if (this.selectedAnswer === null) return;

        const question = this.questions[this.currentQuestionIndex];
        const options = this.optionsContainer.getElementsByClassName('option');
        const isCorrect = question.correctAnswer.includes(String.fromCharCode(65 + this.selectedAnswer));

        options[this.selectedAnswer].classList.add(isCorrect ? 'correct' : 'incorrect');
        
        if (isCorrect) {
            this.score++;
            this.updateScore();
        }

        this.submitButton.style.display = 'none';
        this.nextButton.style.display = 'block';
    }

    nextQuestion() {
        this.currentQuestionIndex++;
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