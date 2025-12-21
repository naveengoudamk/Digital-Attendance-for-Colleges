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
    else {
        // Fallback for others
        alert("Unknown Role");
        logout();
    }
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
        if (!navigator.geolocation) return alert('Geolocation is required');

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const subject = document.getElementById('subject').value;

            try {
                const res = await fetch(`${API_BASE}/start-session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        facultyId: currentUser.id,
                        subject,
                        section: 'A',
                        latitude,
                        longitude
                    })
                });

                if (res.ok) {
                    currentSession = await res.json();
                    document.getElementById('session-active').style.display = 'block';
                    document.getElementById('session-setup').style.display = 'none';

                    // Generate QR
                    generateQRCode(currentSession.sessionToken);
                    document.getElementById('display-session-id').innerText = currentSession.id;
                }
            } catch (err) {
                alert('Failed to start session');
            }
        }, (err) => alert('Location access denied'));
    });
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
