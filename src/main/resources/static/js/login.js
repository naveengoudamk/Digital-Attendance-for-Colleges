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

// Role Switcher Logic
const roleBtns = document.querySelectorAll('.role-btn');
const roleInput = document.getElementById('role-input');
const deptGroup = document.getElementById('department-group');
const deptSelect = document.getElementById('department-select');
const usernameInput = document.querySelector('input[name="username"]');
const usernameLabel = document.getElementById('username-label');
const passwordInput = document.querySelector('input[name="password"]');

const demoCreds = {
    FACULTY: { user: 'T101', pass: 'password', dept: 'CSE', label: 'Teacher ID', placeholder: 'e.g. T101' },
    STUDENT: { user: 'S201', pass: 'password', dept: 'CSE', label: 'School ID', placeholder: 'e.g. S201' },
    ADMIN: { user: 'ADH-001', pass: 'admin', dept: 'ADMIN', label: 'Admin ID', placeholder: 'e.g. ADH-001' },
    HOD: { user: 'HOD1', pass: 'password', dept: 'CSE', label: 'HOD ID', placeholder: 'e.g. HOD1' }
};

roleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // UI Update
        roleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // specific Logic
        const role = btn.getAttribute('data-role');
        if (roleInput) roleInput.value = role;

        if (role === 'ADMIN') {
            if (deptGroup) deptGroup.style.display = 'none';
        } else {
            if (deptGroup) deptGroup.style.display = 'block';
        }

        // Auto-fill Demo Credentials & Update UI
        if (demoCreds[role]) {
            if (usernameInput) {
                usernameInput.value = demoCreds[role].user;
                usernameInput.placeholder = demoCreds[role].placeholder;
            }
            if (passwordInput) passwordInput.value = demoCreds[role].pass;
            if (deptSelect) deptSelect.value = demoCreds[role].dept;
            if (usernameLabel) usernameLabel.innerText = demoCreds[role].label;
        }
    });
});
