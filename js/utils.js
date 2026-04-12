

class Auth {
    static async register(user) {
        const newUser = await API.register(user);
        // Don't auto-login on register, let them login
        return newUser;
    }

    static async login(email, password, role) {
        const user = await API.login(email, password, role);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return user;
    }

    static logout() {
        localStorage.removeItem('currentUser');
        window.location.href = '../index.html';
    }

    static getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }

    static requireAuth(role) {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = '../pages/auth.html';
            return;
        }
        if (role && user.role !== role) {
            window.location.href = '../index.html';
            return;
        }
        return user;
    }
}


