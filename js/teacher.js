// Check authentication
const currentUser = Auth.requireAuth('teacher');
// Mask 'root'
const displayName = currentUser.name === 'root' ? 'Teacher' : currentUser.name;
document.getElementById('user-name').textContent = `Welcome, ${displayName}`;

// User provided Google API Key
const AI_KEY = 'AIzaSyDKjDYb6Q-UieIn6Fkb459JL5XKEcBC8xs';

let questionCount = 0;
let editingQuizId = null;

function showSection(sectionId) {
    ['create-quiz', 'my-quizzes', 'student-scores', 'quiz-choice'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(sectionId);
    if (target) target.classList.remove('hidden');

    // Update buttons state (simple visual toggle)
    document.querySelectorAll('.container > .flex > button').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    });

    if (sectionId === 'create-quiz') {
        // Pre-fill teacher name
        const teacherInput = document.getElementById('quiz-teacher');
        if (teacherInput) teacherInput.value = displayName;
    }

    if (sectionId === 'my-quizzes') loadQuizzes();
    if (sectionId === 'student-scores') loadScores();
}

function startManualQuiz() {
    showSection('create-quiz');
    // Ensure form is clean
    document.getElementById('create-quiz-form').reset();
    document.getElementById('questions-container').innerHTML = '';
    questionCount = 0;
    addQuestion();
}

function addQuestion(data = null) {
    questionCount++;
    const container = document.getElementById('questions-container');
    const questionDiv = document.createElement('div');
    questionDiv.className = 'card mt-4 relative animate-slide-up';
    questionDiv.style.background = 'rgba(0,0,0,0.2)';
    questionDiv.innerHTML = `
        <h4>Question ${questionCount}</h4>
        <div class="input-group mt-4">
            <label>Question Text</label>
            <input type="text" class="q-text" required placeholder="What is 2+2?">
        </div>
        <div class="flex gap-4">
            <div class="input-group w-full">
                <label>Option A</label>
                <input type="text" class="q-opt-a" required>
            </div>
            <div class="input-group w-full">
                <label>Option B</label>
                <input type="text" class="q-opt-b" required>
            </div>
        </div>
        <div class="flex gap-4">
            <div class="input-group w-full">
                <label>Option C</label>
                <input type="text" class="q-opt-c" required>
            </div>
            <div class="input-group w-full">
                <label>Option D</label>
                <input type="text" class="q-opt-d" required>
            </div>
        </div>
        <div class="input-group">
            <label>Correct Answer</label>
            <select class="q-correct">
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
            </select>
        </div>
        ${questionCount > 1 ? `<button type="button" class="btn btn-error btn-sm absolute top-4 right-4" onclick="this.parentElement.remove()">Remove</button>` : ''}
    `;
    container.appendChild(questionDiv);

    if (data) {
        questionDiv.querySelector('.q-text').value = data.text;
        questionDiv.querySelector('.q-opt-a').value = data.options.A;
        questionDiv.querySelector('.q-opt-b').value = data.options.B;
        questionDiv.querySelector('.q-opt-c').value = data.options.C;
        questionDiv.querySelector('.q-opt-d').value = data.options.D;
        questionDiv.querySelector('.q-correct').value = data.correct;
    }
}

document.getElementById('create-quiz-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('quiz-title').value;
    const topic = document.getElementById('quiz-topic').value;
    const timer = document.getElementById('quiz-timer').value;
    const password = document.getElementById('quiz-password').value;

    const questions = [];
    document.querySelectorAll('#questions-container > div').forEach(div => {
        questions.push({
            text: div.querySelector('.q-text').value,
            options: {
                A: div.querySelector('.q-opt-a').value,
                B: div.querySelector('.q-opt-b').value,
                C: div.querySelector('.q-opt-c').value,
                D: div.querySelector('.q-opt-d').value
            },
            correct: div.querySelector('.q-correct').value
        });
    });

    try {
        if (editingQuizId) {
            await API.updateQuiz({
                id: editingQuizId,
                title,
                topic,
                timer: parseInt(timer),
                password,
                questions // Note: Backend update logic for questions is simplified/missing in MVP
            });
            alert('Quiz updated successfully!');
            editingQuizId = null;
            document.querySelector('#create-quiz-form button[type="submit"]').textContent = 'Publish & Start Quiz';
        } else {
            await API.createQuiz({
                teacherId: currentUser.id,
                title,
                topic,
                timer: parseInt(timer),
                password,
                questions
            });
            alert('Quiz created successfully!');
        }

        e.target.reset();
        document.getElementById('questions-container').innerHTML = '';
        questionCount = 0;
        showSection('my-quizzes');
    } catch (error) {
        alert('Failed to save quiz: ' + error.message);
    }
});

async function loadQuizzes() {
    try {
        const quizzes = await API.getQuizzes();
        const myQuizzes = quizzes.filter(q => q.teacherId == currentUser.id); // Loose equality for string/int mismatch
        const container = document.getElementById('quizzes-list');

        if (myQuizzes.length === 0) {
            container.innerHTML = '<p class="text-center">No quizzes created yet.</p>';
            return;
        }

        container.innerHTML = myQuizzes.map(q => {
            const status = q.status || 'active';
            const isStopped = status === 'stopped';

            return `
            <div class="card flex justify-between items-center">
                <div>
                    <div class="flex items-center gap-2">
                        <h3>${q.title}</h3>
                        <span style="font-size: 0.8rem; padding: 2px 8px; border-radius: 12px; background: ${isStopped ? 'var(--error)' : 'var(--success)'}; color: white;">
                            ${isStopped ? 'Stopped' : 'Active'}
                        </span>
                    </div>
                    <p>Topic: ${q.topic} | Questions: ${q.questions.length} | Time: ${q.timer} mins</p>
                    <p class="text-muted" style="font-size: 0.9rem">Password: ${q.password}</p>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-secondary" onclick="editQuiz('${q.id}')">Edit</button>
                    <button class="btn" onclick="stopQuiz('${q.id}', '${isStopped ? 'active' : 'stopped'}')" 
                        style="background: ${isStopped ? 'var(--success)' : 'var(--warning)'}; color: white;">
                        ${isStopped ? 'Start' : 'Stop'}
                    </button>
                    <button class="btn btn-error" onclick="deleteQuiz('${q.id}')" style="background: var(--error); color: white;">Delete</button>
                </div>
            </div>
        `}).join('');
    } catch (error) {
        console.error('Failed to load quizzes:', error);
    }
}

async function editQuiz(id) {
    try {
        const quizzes = await API.getQuizzes();
        const quiz = quizzes.find(q => q.id == id);
        if (!quiz) return;

        editingQuizId = id;

        document.getElementById('quiz-title').value = quiz.title;
        document.getElementById('quiz-topic').value = quiz.topic;
        document.getElementById('quiz-timer').value = quiz.timer;
        document.getElementById('quiz-password').value = quiz.password;

        const teacherInput = document.getElementById('quiz-teacher');
        if (teacherInput) teacherInput.value = currentUser.name;

        document.getElementById('questions-container').innerHTML = '';
        questionCount = 0;

        quiz.questions.forEach(q => addQuestion(q));

        const submitBtn = document.querySelector('#create-quiz-form button[type="submit"]');
        submitBtn.textContent = 'Update Quiz';

        showSection('create-quiz');
    } catch (error) {
        console.error('Error editing quiz:', error);
    }
}

async function stopQuiz(id, newStatus) {
    try {
        await API.stopQuiz(id, newStatus);
        loadQuizzes();
    } catch (error) {
        alert('Failed to update status: ' + error.message);
    }
}

async function deleteQuiz(id) {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
        await API.deleteQuiz(id);
        loadQuizzes();
    } catch (error) {
        alert('Failed to delete quiz: ' + error.message);
    }
}

// --- Result Dashboard Logic ---

let searchTimeout;

document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadScores(), 300);
});

document.getElementById('sort-select').addEventListener('change', () => loadScores());

async function loadScores() {
    const tableBody = document.getElementById('scores-table-body');
    const loadingDiv = document.getElementById('scores-loading');
    const emptyDiv = document.getElementById('scores-empty');
    const search = document.getElementById('search-input').value;
    const sort = document.getElementById('sort-select').value;

    try {
        tableBody.innerHTML = '';
        loadingDiv.classList.remove('hidden');
        emptyDiv.classList.add('hidden');

        // Fetch results with filters
        const url = `../api/results.php?search=${encodeURIComponent(search)}&sort=${sort}`;
        const response = await fetch(url);
        const results = await response.json();

        // Also fetch quizzes to filter by teacher ownership if needed, 
        // OR rely on the fact that teachers can see all results or just theirs. 
        // For this requirement: "View a table/list of all students who attempted the quiz."
        // Usually a teacher only sees their own quizzes. 
        // Let's verify ownership client-side for safety or better UX if API returns global results.

        const quizzes = await API.getQuizzes();
        const myQuizIds = quizzes.filter(q => q.teacherId == currentUser.id).map(q => q.id);

        // Filter results to only show those belonging to this teacher's quizzes
        const myResults = results.filter(r => myQuizIds.includes(parseInt(r.quizId)));

        loadingDiv.classList.add('hidden');

        if (myResults.length === 0) {
            emptyDiv.classList.remove('hidden');
            return;
        }

        tableBody.innerHTML = myResults.map(r => `
            <tr class="border-b" style="border-color: var(--border);">
                <td class="p-4 font-medium">${r.studentName}</td>
                <td class="p-4">${r.quizTitle || 'Unknown Quiz'}</td>
                <td class="p-4">
                    <span style="color: ${r.score >= 50 ? 'var(--success)' : 'var(--error)'}; font-weight: bold;">
                        ${r.score}%
                    </span> 
                    <span class="text-sm text-muted">(${r.correctAnswers}/${r.totalQuestions})</span>
                </td>
                <td class="p-4 text-muted">${new Date(r.submittedAt).toLocaleDateString()} ${new Date(r.submittedAt).toLocaleTimeString()}</td>
                <td class="p-4">${r.attempts}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading scores:', error);
        loadingDiv.classList.add('hidden');
        tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-error">Failed to load results.</td></tr>`;
    }
}

// --- AI Generation Logic ---

function openAIGenerationModal() {
    document.getElementById('ai-generation-modal').classList.remove('hidden');
}

function closeAIGenerationModal() {
    document.getElementById('ai-generation-modal').classList.add('hidden');
}

async function startAIGeneration() {
    const subject = document.getElementById('ai-subject').value;
    const count = document.getElementById('ai-count').value;
    const difficulty = document.getElementById('ai-difficulty').value;
    const processingModal = document.getElementById('ai-processing-modal');

    if (!subject) {
        alert('Please enter a subject.');
        return;
    }

    closeAIGenerationModal();
    processingModal.classList.remove('hidden');

    try {
        console.log('Using API Key:', AI_KEY); // Debug logging

        // Pass key in header to avoid URL encoding issues
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': AI_KEY
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Generate ${count} multiple choice questions on the subject '${subject}' with ${difficulty} difficulty. Return ONLY a valid JSON array of objects. Each object must have: "text" (string), "options" (object with keys A, B, C, D), and "correct" (string, just the letter).`
                    }]
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('API Error Details:', data);
            throw new Error(data.error?.message || response.statusText);
        }

        const content = data.candidates[0].content.parts[0].text;
        const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const questions = JSON.parse(jsonString);

        // Switch to create view
        showSection('create-quiz');
        // Pre-fill topic
        document.getElementById('quiz-topic').value = subject;

        // Clear existing questions
        document.getElementById('questions-container').innerHTML = '';
        questionCount = 0;

        questions.forEach(q => addQuestion(q));
        alert(`Successfully generated ${questions.length} questions!`);

    } catch (error) {
        console.error('AI Generation Error:', error);

        let msg = error.message;
        if (msg.includes('429')) msg = 'Quota exceeded. Please wait a minute and try again.';
        if (msg.includes('400')) msg = 'Invalid Request. Check API Key.';

        alert(`Failed to generate questions: ${msg}`);
    } finally {
        processingModal.classList.add('hidden');
    }
}


// Initialize view
showSection('quiz-choice');
