const API_BASE = '../api';

class API {
    static async request(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const url = `${API_BASE}/${endpoint}`;
            console.log('Fetching:', url);
            const response = await fetch(url, options);
            const text = await response.text();

            let result;
            try {
                // Check if the server returned raw PHP code (common mistake using Live Server)
                if (text.includes('<?php') || text.includes('header("Access-Control-Allow-Origin')) {
                    throw new Error('PHP code was not executed. Are you using XAMPP/WAMP? You cannot use "Live Server" extension for PHP.');
                }
                result = JSON.parse(text);
            } catch (e) {
                console.error('API Raw Response:', text);
                if (e.message.includes('PHP code was not executed')) {
                    throw e;
                }
                throw new Error('Server returned invalid JSON. Check console for details.');
            }

            if (result.error) {
                throw new Error(result.error);
            }
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth
    static async register(user) {
        return await this.request('auth.php?action=register', 'POST', user);
    }

    static async login(email, password, role) {
        return await this.request('auth.php?action=login', 'POST', { email, password, role });
    }

    // Quizzes
    static async getQuizzes() {
        return await this.request('quizzes.php');
    }

    static async createQuiz(quiz) {
        return await this.request('quizzes.php?action=create', 'POST', quiz);
    }

    static async updateQuiz(quiz) {
        return await this.request('quizzes.php?action=update', 'POST', quiz);
    }

    static async stopQuiz(id, status) {
        return await this.request('quizzes.php?action=stop', 'POST', { id, status });
    }

    static async deleteQuiz(id) {
        return await this.request('quizzes.php?action=delete', 'POST', { id });
    }

    // Results
    static async getResults() {
        return await this.request('results.php');
    }

    static async submitResult(result) {
        return await this.request('results.php', 'POST', result);
    }
}
