const API_BASE = '/api';

// State
let currentUser = JSON.parse(localStorage.getItem('user'));
let currentSession = null;

// DOM Elements
const views = {
    faculty: document.getElementById('faculty-view'),
    student: document.getElementById('student-view'),
    admin: document.getElementById('admin-view'),
    hod: document.getElementById('hod-view')
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
        loadTimetable('FACULTY');
        document.getElementById('faculty-timetable-card').style.display = 'block';
    }
    else if (currentUser.role === 'STUDENT') {
        showView('student');
        document.getElementById('user-name-display-student').innerText = `Welcome, ${currentUser.fullName}`;
        loadStudentHistory();
        loadTimetable('STUDENT');
    }
    else if (currentUser.role === 'ADMIN') {
        showView('admin');
        loadAdminStats();
    }
    else if (currentUser.role === 'HOD') {
        showView('hod');
        document.getElementById('hod-dept-name').innerText = currentUser.department;
        // Load HOD specific data
        loadHODStats();
        loadTimetable('HOD'); // Loads all for dept
    }
    // Parent removed
    else {
        // Fallback for others
        alert("Unknown Role");
        logout();
    }
}

// Admin Logic
const views_admin = {
    dashboard: document.getElementById('admin-tab-dashboard'),
    users: document.getElementById('admin-tab-users'),
    timetable: document.getElementById('admin-tab-timetable')
}

window.switchAdminTab = (tabName) => {
    // Hide all
    Object.values(views_admin).forEach(el => el.style.display = 'none');
    // Show target
    if (views_admin[tabName]) views_admin[tabName].style.display = 'block';

    // Lazy load users
    if (tabName === 'users') {
        loadUsers();
    }
    else if (tabName === 'timetable') {
        loadTimetable('ADMIN');
    }

    // Update buttons active state
    const btns = document.querySelectorAll('#admin-view .role-btn');
    btns.forEach(b => {
        if (b.innerText.toLowerCase().replaceAll(' ', '').includes(tabName)) {
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

async function loadUsers() {
    try {
        const res = await fetch(`${API_BASE}/admin/users`);
        if (res.ok) {
            const users = await res.json();
            const tbody = document.getElementById('user-list-body');
            tbody.innerHTML = '';
            users.forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05)">${u.role}</td>
                    <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05)">${u.fullName}</td>
                    <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05)">${u.department}</td>
                    <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05)">${u.username}</td>
                    <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05)">${u.email || '-'}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) { console.error("Failed to load users", e); }
}

const createUserForm = document.getElementById('create-user-form');
if (createUserForm) {
    createUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const role = document.getElementById('new-user-role').value;
        const fullName = document.getElementById('new-user-name').value;
        const department = document.getElementById('new-user-dept').value;
        const username = document.getElementById('new-user-id').value; // ID
        const email = document.getElementById('new-user-email').value; // Email
        const password = document.getElementById('new-user-pass').value;

        try {
            const res = await fetch(`${API_BASE}/admin/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, fullName, department, username, email, password })
            });

            if (res.ok) {
                alert('User Created Successfully');
                createUserForm.reset();
                loadAdminStats(); // Refresh stats
                loadUsers(); // Refresh list
            } else {
                alert('Failed: ' + await res.text());
            }
        } catch (err) {
            alert('Error creating user');
        }
    });
}

const addTimetableForm = document.getElementById('add-timetable-form');
if (addTimetableForm) {
    addTimetableForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dayOfWeek = document.getElementById('tt-day').value;
        const startTime = document.getElementById('tt-start').value;
        const endTime = document.getElementById('tt-end').value;
        const subject = document.getElementById('tt-subject').value;
        const section = document.getElementById('tt-section').value;
        const facultyId = document.getElementById('tt-faculty-id').value;

        try {
            const res = await fetch(`${API_BASE}/admin/timetable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dayOfWeek, startTime, endTime, subject, section, facultyId })
            });
            if (res.ok) {
                alert("Class Schedule Added!");
                addTimetableForm.reset();
                loadTimetable('ADMIN');
            } else {
                alert("Failed: " + await res.text());
            }
        } catch (e) { console.error('Error adding timetable', e); }
    });
}

// Student History
async function loadStudentHistory() {
    try {
        const res = await fetch(`${API_BASE}/student/${currentUser.id}/history`);
        if (res.ok) {
            const records = await res.json();
            const container = document.getElementById('history-list');
            container.innerHTML = '';

            if (records.length === 0) {
                container.innerHTML = '<div style="padding:10px;">No records found.</div>';
                return;
            }

            records.forEach(r => {
                // Date formatting
                const date = new Date(r.timestamp).toLocaleString();
                const statusColor = r.status === 'PRESENT' ? 'var(--success)' : 'var(--error)';

                const div = document.createElement('div');
                div.style.padding = '10px';
                div.style.borderBottom = '1px solid var(--border)';
                div.innerHTML = `
                    <div class="flex-between">
                        <span style="font-weight:600">${r.session.subject}</span>
                        <span style="color:${statusColor}">${r.status}</span>
                    </div>
                    <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">
                        ${date}
                        ${r.rejectionReason ? `<br><span style="color:var(--error)">Reason: ${r.rejectionReason}</span>` : ''}
                    </div>
                 `;
                container.appendChild(div);
            });
        }
    } catch (e) { console.error(e); }
}

// Student Mode Toggle
window.setStudentMode = (mode) => {
    const grpId = document.getElementById('grp-session-id');
    const scanBtn = document.getElementById('scan-btn');
    const btnStd = document.getElementById('mode-std-btn');
    const btnSimple = document.getElementById('mode-simple-btn');

    if (mode === 'simple') {
        if (grpId) grpId.style.display = 'none';
        if (scanBtn) scanBtn.style.display = 'none';

        btnSimple.style.opacity = '1';
        btnSimple.style.background = 'var(--primary)';
        btnStd.style.opacity = '0.5';
        btnStd.style.background = 'var(--secondary)';

        document.getElementById('student-session-id').value = '';
    } else {
        if (grpId) grpId.style.display = 'block';
        if (scanBtn) scanBtn.style.display = 'inline-block';

        btnStd.style.opacity = '1';
        btnStd.style.background = 'var(--primary)';
        btnSimple.style.opacity = '0.5';
        btnSimple.style.background = 'var(--secondary)';
    }
};

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
        const tokenType = document.getElementById('token-type').value;
        const tokenLength = tokenType === 'simple' ? 8 : 0;
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
                        tokenLength: tokenLength,
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

                    const tokenDisplay = document.getElementById('display-token');
                    if (tokenDisplay) {
                        tokenDisplay.innerText = currentSession.sessionToken;
                        tokenDisplay.onclick = () => {
                            navigator.clipboard.writeText(currentSession.sessionToken);
                            alert("Token Copied!");
                        }
                    }
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

// HOD & Timetable Logic
async function loadHODStats() {
    try {
        const res = await fetch(`${API_BASE}/admin/stats`);
        if (res.ok) {
            const stats = await res.json();
            document.getElementById('hod-stat-students').innerText = Math.floor(stats.totalStudents / 3);
            document.getElementById('hod-stat-sessions').innerText = Math.floor(stats.activeSessions / 2);
        }
    } catch (e) { }
}

async function loadTimetable(viewType) {
    try {
        let url = `${API_BASE}/timetable`;
        const res = await fetch(url);
        if (res.ok) {
            const allEntries = await res.json();
            let entries = allEntries;
            let containerId = '';

            if (viewType === 'STUDENT') {
                containerId = 'student-timetable-list';
                entries = allEntries.filter(e => e.section === currentUser.department);
            } else if (viewType === 'FACULTY') {
                containerId = 'faculty-timetable-list';
                entries = allEntries.filter(e => e.faculty.id === currentUser.id);
            } else if (viewType === 'HOD') {
                containerId = 'hod-timetable-list';
                entries = allEntries.filter(e => e.section === currentUser.department);
            } else if (viewType === 'ADMIN') {
                containerId = 'admin-timetable-list';
                entries = allEntries; // Show all
            }

            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '';
                if (entries.length === 0) {
                    container.innerHTML = '<p style="color:var(--text-muted)">No classes scheduled.</p>';
                    return;
                }

                entries.forEach(t => {
                    const div = document.createElement('div');
                    div.className = 'card';
                    div.style.padding = '12px';
                    div.style.marginBottom = '8px';
                    div.style.background = 'rgba(255,255,255,0.03)';

                    let deleteBtn = '';
                    if (viewType === 'ADMIN') {
                        deleteBtn = `<button onclick="deleteTimetableEntry(${t.id})" style="float:right; background:var(--error); border:none; color:white; padding:4px 8px; border-radius:4px; font-size:0.8rem; cursor:pointer;">Delete</button>`;
                    }

                    div.innerHTML = `
                        ${deleteBtn}
                        <div class="flex-between">
                            <span style="font-weight:bold; color:var(--primary)">${t.dayOfWeek}</span>
                            <span>${t.startTime} - ${t.endTime}</span>
                        </div>
                        <div style="margin-top:4px;">${t.subject}</div>
                        <div style="font-size:0.8rem; color:var(--text-muted)">
                            Faculty: ${t.faculty ? t.faculty.fullName : 'N/A'} | Section: ${t.section}
                        </div>
                    `;
                    container.appendChild(div);
                });
            }
        }
    } catch (e) { console.error("Timetable load failed", e); }
}

window.deleteTimetableEntry = async (id) => {
    if (!confirm("Delete this schedule?")) return;
    try {
        const res = await fetch(`${API_BASE}/admin/timetable/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadTimetable('ADMIN');
        } else {
            alert("Failed to delete");
        }
    } catch (e) { console.error(e); }
};

init();
