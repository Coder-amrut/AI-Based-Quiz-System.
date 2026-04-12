const urlParams = new URLSearchParams(window.location.search);
const role = urlParams.get('role') || 'student';
let isLogin = true;

// Update UI based on role
document.getElementById('auth-subtitle').textContent = `Please sign in to your ${role} account`;

function switchMode(mode) {
    isLogin = mode === 'signin';
    const btnSignin = document.getElementById('btn-signin');
    const btnSignup = document.getElementById('btn-signup');
    const nameGroup = document.getElementById('name-group');
    const title = document.getElementById('auth-title');

    if (isLogin) {
        btnSignin.className = 'btn btn-primary w-full';
        btnSignup.className = 'btn btn-secondary w-full';
        nameGroup.style.display = 'none';
        title.textContent = 'Welcome Back';
        document.getElementById('name').required = false;
    } else {
        btnSignin.className = 'btn btn-secondary w-full';
        btnSignup.className = 'btn btn-primary w-full';
        nameGroup.style.display = 'flex';
        title.textContent = 'Create Account';
        document.getElementById('name').required = true;
    }
}

document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('name').value;

    try {
        if (isLogin) {
            const user = await Auth.login(email, password, role);
            alert(`Welcome back, ${user.name}!`);
            window.location.href = role === 'teacher' ? 'teacher-dashboard.html' : 'student-dashboard.html';
        } else {
            const user = {
                name,
                email,
                password,
                role
            };
            await Auth.register(user);
            // Auto login after register
            await Auth.login(email, password, role);
            alert('Account created successfully!');
            window.location.href = role === 'teacher' ? 'teacher-dashboard.html' : 'student-dashboard.html';
        }
    } catch (error) {
        alert(error.message);
    }
});
