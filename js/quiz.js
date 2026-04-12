const currentUser = Auth.requireAuth('student');
const quizId = sessionStorage.getItem('currentQuizId');

if (!quizId) {
    window.location.href = 'student-dashboard.html';
}

let quiz = null;
let currentQuestionIndex = 0;
const userAnswers = {}; // { questionIndex: 'A' }
let timerInterval;
let timeLeft;

async function initQuiz() {
    try {
        const quizzes = await API.getQuizzes();
        quiz = quizzes.find(q => q.id == quizId);

        if (!quiz) {
            alert('Quiz not found!');
            window.location.href = 'student-dashboard.html';
            return;
        }

        document.getElementById('quiz-title').textContent = quiz.title;
        timeLeft = quiz.timer * 60; // seconds
        startTimer();
        renderQuestion();
    } catch (error) {
        console.error('Error initializing quiz:', error);
        alert('Failed to load quiz data.');
        window.location.href = 'student-dashboard.html';
    }
}

function startTimer() {
    const timerDisplay = document.getElementById('timer');
    timerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert('Time is up! Submitting your quiz automatically.');
            submitQuiz();
        }
        timeLeft--;
    }, 1000);
}

function renderQuestion() {
    const container = document.getElementById('quiz-container');
    const question = quiz.questions[currentQuestionIndex];

    // Calculate Stats
    const totalQuestions = quiz.questions.length;
    const solvedCount = Object.keys(userAnswers).length;
    // Skipped: Questions passed (index < current) that are NOT answered
    let skippedCount = 0;
    for (let i = 0; i < currentQuestionIndex; i++) {
        if (!userAnswers[i]) skippedCount++;
    }

    // Remaining: Questions ahead (index > current)
    const remainingCount = totalQuestions - (currentQuestionIndex + 1);

    document.getElementById('stat-solved').textContent = solvedCount;
    document.getElementById('stat-skipped').textContent = skippedCount;
    document.getElementById('stat-remaining').textContent = remainingCount;

    container.innerHTML = `
        <div class="card">
            <div class="flex justify-between mb-4">
                <span class="text-muted">Question ${currentQuestionIndex + 1} of ${totalQuestions}</span>
            </div>
            <h3 class="mb-4">${question.text}</h3>
            <div class="flex flex-col">
                ${Object.entries(question.options).map(([key, value]) => `
                    <div class="quiz-option ${userAnswers[currentQuestionIndex] === key ? 'selected' : ''}" onclick="selectAnswer('${key}')">
                        <div class="option-key">${key}</div>
                        <span>${value}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Update buttons
    document.getElementById('prev-btn').disabled = currentQuestionIndex === 0;

    if (currentQuestionIndex === quiz.questions.length - 1) {
        document.getElementById('next-btn').classList.add('hidden');
        document.getElementById('skip-btn').classList.add('hidden'); // Hide skip on last question
        document.getElementById('submit-btn').classList.remove('hidden');
    } else {
        document.getElementById('next-btn').classList.remove('hidden');
        document.getElementById('skip-btn').classList.remove('hidden');
        document.getElementById('submit-btn').classList.add('hidden');
    }
}

function selectAnswer(answer) {
    userAnswers[currentQuestionIndex] = answer;
    renderQuestion(); // Re-render to update styles
}

function nextQuestion() {
    if (currentQuestionIndex < quiz.questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    }
}

function skipQuestion() {
    // Explicitly remove answer if any (though usually they wouldn't have clicked one)
    delete userAnswers[currentQuestionIndex];
    nextQuestion();
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

async function submitQuiz() {
    clearInterval(timerInterval);

    let correctCount = 0;
    quiz.questions.forEach((q, index) => {
        if (userAnswers[index] === q.correct) {
            correctCount++;
        }
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);

    const result = {
        quizId: quiz.id,
        studentId: currentUser.id,
        studentName: currentUser.name,
        score: score,
        correctAnswers: correctCount,
        totalQuestions: quiz.questions.length
    };

    try {
        await API.submitResult(result);

        // Show Result UI
        document.getElementById('quiz-container').classList.add('hidden');
        document.getElementById('prev-btn').classList.add('hidden');
        document.getElementById('next-btn').classList.add('hidden');
        document.getElementById('submit-btn').classList.add('hidden');
        document.getElementById('timer').parentElement.classList.add('hidden');

        const resultContainer = document.getElementById('result-container');
        resultContainer.classList.remove('hidden');

        // Update Score UI
        document.getElementById('score-percentage').textContent = `${score}%`;
        document.getElementById('score-correct').textContent = correctCount;
        document.getElementById('score-total').textContent = quiz.questions.length;

        // Update Ring Progress
        const ring = document.getElementById('score-ring');
        ring.style.setProperty('--progress', `${score * 3.6}deg`); // 360deg * percentage
    } catch (error) {
        alert('Failed to submit quiz: ' + error.message);
    }
}

initQuiz();
