const API_BASE = '/api';

// State
let currentUser = JSON.parse(localStorage.getItem('user'));
let currentSession = null;

// DOM Elements
const views = {
    faculty: document.getElementById('faculty-view'),
    student: document.getElementById('student-view')
};

function showView(viewName) {
    Object.values(views).forEach(el => {
        if (el) el.classList.remove('active');
    });
    if (views[viewName]) views[viewName].classList.add('active');
}

function init() {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    if (currentUser.role === 'FACULTY') {
        showView('faculty');
        document.getElementById('user-name-display').innerText = `Welcome, ${currentUser.fullName}`;
    }
    else if (currentUser.role === 'STUDENT') {
        showView('student');
        document.getElementById('user-name-display-student').innerText = `Welcome, ${currentUser.fullName}`;
    }
    else if (currentUser.role === 'ADMIN') {
        showView('admin');
        loadAdminStats();
    }
    else {
        // Fallback for others
        alert("Unknown Role");
        logout();
    }
}

// ... existing code ...

// Admin Logic
const views_admin = {
    dashboard: document.getElementById('admin-tab-dashboard'),
    users: document.getElementById('admin-tab-users')
}

window.switchAdminTab = (tabName) => {
    // Hide all
    Object.values(views_admin).forEach(el => el.style.display = 'none');
    // Show target
    if (views_admin[tabName]) views_admin[tabName].style.display = 'block';

    // Update buttons active state
    const btns = document.querySelectorAll('#admin-view .role-btn');
    btns.forEach(b => {
        if (b.innerText.toLowerCase().includes(tabName === 'dashboard' ? 'overview' : 'users')) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });
}

async function loadAdminStats() {
    try {
        const res = await fetch(`${API_BASE}/admin/stats`);
        if (res.ok) {
            const stats = await res.json();
            document.getElementById('stat-students').innerText = stats.totalStudents;
            document.getElementById('stat-faculty').innerText = stats.totalFaculty;
            document.getElementById('stat-sessions').innerText = stats.activeSessions;
            document.getElementById('stat-defaulters').innerText = stats.defaultersCount;
        }
    } catch (e) {
        console.error("Failed to load stats", e);
    }
}

const createUserForm = document.getElementById('create-user-form');
if (createUserForm) {
    createUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const role = document.getElementById('new-user-role').value;
        const fullName = document.getElementById('new-user-name').value;
        const department = document.getElementById('new-user-dept').value;
        const username = document.getElementById('new-user-email').value;
        const password = document.getElementById('new-user-pass').value;

        try {
            const res = await fetch(`${API_BASE}/admin/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, fullName, department, username, password })
            });

            if (res.ok) {
                alert('User Created Successfully');
                createUserForm.reset();
                loadAdminStats(); // Refresh stats
            } else {
                alert('Failed: ' + await res.text());
            }
        } catch (err) {
            alert('Error creating user');
        }
    });
}

// Logout
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Faculty: Start Session
const startSessionBtn = document.getElementById('start-session-btn');
if (startSessionBtn) {
    startSessionBtn.addEventListener('click', async () => {
        const subject = document.getElementById('subject').value;
        const section = document.getElementById('section').value;
        const duration = document.getElementById('duration').value;
        const useMock = document.getElementById('mock-location-check').checked;

        // Helper to send request
        const sendStartRequest = async (lat, lng) => {
            try {
                const res = await fetch(`${API_BASE}/start-session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        facultyId: currentUser.id,
                        subject,
                        section,
                        durationMinutes: duration,
                        latitude: lat,
                        longitude: lng
                    })
                });

                if (res.ok) {
                    currentSession = await res.json();
                    document.getElementById('session-active').style.display = 'block';
                    document.getElementById('session-setup').style.display = 'none';

                    // Generate QR
                    generateQRCode(currentSession.sessionToken);
                    document.getElementById('display-session-id').innerText = currentSession.id;
                } else {
                    alert("Error: " + await res.text());
                }
            } catch (err) {
                alert('Failed to start session: Network error');
            }
        };

        if (useMock) {
            // Mock Coordinates (e.g. Center of Campus)
            sendStartRequest(12.9716, 77.5946);
        } else {
            if (!navigator.geolocation) return alert('Geolocation is required');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    sendStartRequest(latitude, longitude);
                },
                (err) => {
                    if (confirm("Location access denied or failed. Switch to Mock Location Mode for testing?")) {
                        document.getElementById('mock-location-check').checked = true;
                        sendStartRequest(12.9716, 77.5946);
                    } else {
                        alert('Location access denied. Cannot start session.');
                    }
                }
            );
        }
    });

    // Also Initialize Checkbox state from localStorage if needed (optional)
}

function generateQRCode(token) {
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';
    if (window.QRCode) {
        new QRCode(qrContainer, {
            text: token,
            width: 200,
            height: 200
        });
    } else {
        qrContainer.innerText = "Token: " + token;
    }
}

// Student logic
const manualMarkBtn = document.getElementById('manual-mark-btn');
if (manualMarkBtn) {
    manualMarkBtn.addEventListener('click', () => {
        const sid = prompt("Enter Session ID:");
        const token = prompt("Enter Token:");
        if (!sid || !token) return;

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const res = await fetch(`${API_BASE}/mark-attendance`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: sid,
                        studentId: currentUser.id,
                        qrToken: token,
                        latitude,
                        longitude
                    })
                });
                alert(await res.text());
            } catch (e) { alert(e); }
        });
    });
}

init();
