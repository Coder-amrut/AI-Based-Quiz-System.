const currentUser = Auth.requireAuth('student');

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('student-name').textContent = currentUser.name;
    await loadDashboardData();
});

async function loadDashboardData() {
    try {
        const [quizzes, results] = await Promise.all([
            API.getQuizzes(),
            API.getResults({ student_id: currentUser.id }) // We need to ensure API supports this, we checked specific usage in code, let's proceed assuming we will simply filter client side if needed or update API call
        ]);

        // Note: API.getResults() in current api.js takes no arguments and returns all results. 
        // We might need to filter client-side if the API doesn't support filtering by default, 
        // OR we noticed in api/results.php it CHECKS for $_GET['student_id'].
        // However, API.request in api.js doesn't easily allow passing query params for GET unless we modify the URL.
        // Let's check api.js again. static getResults() calls 'results.php'. 
        // We might need to manually call API.request('results.php?student_id=' + currentUser.id) if existing wrapper is too simple.

        // Let's refetch differently to be safe given the api.js limitation seen earlier.
        // actually looking back at api.js view:
        // static async getResults() { return await this.request('results.php'); }
        // It does NOT accept arguments. So we cannot use it to filter directly without modifying api.js or calling request directly.
        // I will use API.request directly for optimal performance if possible, or just filter client side if the dataset is small.
        // Given this is a local project, client side filtering of what getResults returns is safer if we can't trust the previous dev's wrapper.
        // BUT, looking at results.php, it DOES return all results if no student_id is passed.
        // Let's simply call the raw API.request to pass the param.

        const myResults = await API.request(`results.php?student_id=${currentUser.id}`);

        renderLiveTests(quizzes, myResults);
        renderResults(myResults);
        renderStats(myResults);

    } catch (error) {
        console.error('Failed to load dashboard:', error);
        alert('Failed to load dashboard data. Please try refreshing.');
    }
}

function renderLiveTests(quizzes, myResults) {
    const list = document.getElementById('live-tests-container');
    const liveCount = document.getElementById('live-count');

    // Filter for active quizzes that the student hasn't taken yet (or unlimited attempts? usually once)
    // For now, let's assume multiple attempts are allowed OR just show all active.
    // Let's valid check active status if it exists. JSON for quizzes showed "status" field in one of the tools?
    // In quizzes.php: SELECT * FROM quizzes. It does not seem to have a status filter in the SQL, but let's check the objects.
    // If no status field, we assume all are active.

    // Check if student has already taken it?
    // Helper to check if quizId is in results
    const takenQuizIds = new Set(myResults.map(r => r.quizId));

    // For better UX, let's show all that are NOT stopped/deleted.
    // Assuming 'status' field might exist or defaults to active.

    const activeQuizzes = quizzes.filter(q => {
        // If status exists verify it's active. If not, assume active.
        const isActive = q.status ? q.status === 'active' : true;
        // Optional: Hide taken tests? or Show "Retake"?
        // The prompt says "see all live test". 
        // Let's show all active ones. mark taken ones.
        return isActive;
    });

    liveCount.textContent = `${activeQuizzes.length} Available`;

    if (activeQuizzes.length === 0) {
        list.innerHTML = `
            <div class="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <p class="text-gray-500">No live tests available at the moment.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = activeQuizzes.map(quiz => {
        const isTaken = takenQuizIds.has(quiz.id);
        const buttonText = isTaken ? 'Retake Test' : 'Start Test';
        const buttonClass = isTaken
            ? 'px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors'
            : 'px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors';

        return `
        <div class="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:shadow-md transition-all duration-200 hover:border-indigo-100">
            <div class="mb-4 sm:mb-0">
                <div class="flex items-center gap-3 mb-1">
                    <h3 class="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">${quiz.title}</h3>
                    ${isTaken ? '<span class="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Completed</span>' : ''}
                </div>
                <div class="flex items-center text-sm text-gray-500 gap-4">
                    <span class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        ${quiz.timer} mins
                    </span>
                    <span class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                        ${quiz.topic}
                    </span>
                </div>
            </div>
            <button onclick="takeTest(${quiz.id})" class="${buttonClass}">
                ${buttonText}
            </button>
        </div>
    `}).join('');
}

function renderResults(results) {
    const list = document.getElementById('results-container');

    if (results.length === 0) {
        list.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-400">No results found.</p>
            </div>
        `;
        return;
    }

    // Sort by most recent
    const sorted = [...results].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    list.innerHTML = sorted.map(r => `
        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div>
                <h4 class="text-sm font-semibold text-gray-900">${r.quizTitle || 'Unknown Quiz'}</h4>
                <div class="text-xs text-gray-500 mt-1">${new Date(r.submittedAt).toLocaleDateString()}</div>
            </div>
            <div class="text-right">
                <div class="text-lg font-bold ${getScoreColor(r.score)}">${r.score}%</div>
                <div class="text-xs text-gray-500">${r.correctAnswers}/${r.totalQuestions} correct</div>
            </div>
        </div>
    `).join('');
}

function renderStats(results) {
    const totalTests = results.length;

    let avgScore = 0;
    if (totalTests > 0) {
        const totalScore = results.reduce((acc, curr) => acc + parseFloat(curr.score), 0);
        avgScore = Math.round(totalScore / totalTests);
    }

    document.getElementById('total-tests-taken').textContent = totalTests;
    document.getElementById('average-score').textContent = `${avgScore}%`;
}

function getScoreColor(score) {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
}

function takeTest(quizId) {
    sessionStorage.setItem('currentQuizId', quizId);
    window.location.href = 'quiz.html';
}
