const API_BASE = '/api';

// Check if already logged in
if (localStorage.getItem('user')) {
    window.location.href = 'index.html';
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const role = e.target.role.value;
    const department = e.target.department.value;
    const username = e.target.username.value;
    const password = e.target.password.value;

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role, department })
        });

        if (res.ok) {
            const user = await res.json();
            localStorage.setItem('user', JSON.stringify(user));
            window.location.href = 'index.html';
        } else {
            alert('Invalid Credentials');
        }
    } catch (err) {
        console.error(err);
        alert('Login failed');
    }
});
