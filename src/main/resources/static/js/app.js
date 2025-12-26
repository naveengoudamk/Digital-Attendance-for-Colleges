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

    // Initialize Time Pickers
    if (window.flatpickr) {
        flatpickr("#tt-start", {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true
        });
        flatpickr("#tt-end", {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true
        });
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
                loadTimetable('HOD'); // Refresh HOD list
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
// Student Mode Toggle removed


// Logout
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Faculty: Start Session
const startSessionBtn = document.getElementById('start-session-btn');
if (startSessionBtn) {
    startSessionBtn.addEventListener('click', async () => {
        if (!currentUser || !currentUser.id) {
            alert("User session invalid. Please logout and login again.");
            return;
        }
        const subject = document.getElementById('subject').value;
        const section = document.getElementById('section').value;
        const duration = document.getElementById('duration').value;
        const tokenLength = 0; // Standard UUID

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

        if (!navigator.geolocation) return alert('Geolocation is required');

        const originalText = startSessionBtn.innerText;
        startSessionBtn.innerText = "Locating & Starting...";
        startSessionBtn.disabled = true;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                sendStartRequest(latitude, longitude).finally(() => {
                    startSessionBtn.innerText = originalText;
                    startSessionBtn.disabled = false;
                });
            },
            (err) => {
                console.error(err);
                alert('Location access denied or failed. Ensure permissions are granted and location is on.');
                startSessionBtn.innerText = originalText;
                startSessionBtn.disabled = false;
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
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
                renderSimpleList(entries, containerId, viewType);
            } else if (viewType === 'FACULTY') {
                containerId = 'faculty-timetable-list';
                entries = allEntries.filter(e => e.faculty.id === currentUser.id);
                renderSimpleList(entries, containerId, viewType);
            } else if (viewType === 'HOD') {
                containerId = 'hod-timetable-list';
                entries = allEntries.filter(e => e.section === currentUser.department);
                renderTimetableGrid(entries, containerId);
            }
        }
    } catch (e) { console.error("Timetable load failed", e); }
}

function renderSimpleList(entries, containerId, viewType) {
    const container = document.getElementById(containerId);
    if (!container) return;
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

        div.innerHTML = `
            <div class="flex-between">
                <span style="font-weight:bold; color:var(--primary)">${t.dayOfWeek}</span>
                <span>${t.startTime} - ${t.endTime}</span>
            </div>
            <div style="margin-top:4px;">${t.subject}</div>
            <div style="font-size:0.8rem; color:var(--text-muted)">
                Faculty: ${t.faculty ? t.faculty.fullName : 'N/A'} | Section: ${t.section}
            </div>
        `;

        if (viewType === 'STUDENT') {
            div.style.cursor = 'pointer';
            div.title = "Click to check class status";
            div.onclick = async () => {
                try {
                    const res = await fetch(`${API_BASE}/session/active?subject=${encodeURIComponent(t.subject)}&section=${encodeURIComponent(t.section)}`);
                    if (res.ok) {
                        const session = await res.json();
                        if (confirm(`Class '${t.subject}' is Active!\nSession ID: ${session.id}\nDo you want to mark attendance?`)) {
                            document.getElementById('student-session-id').value = session.id;
                            document.getElementById('manual-mark-btn').scrollIntoView({ behavior: 'smooth' });
                        }
                    } else {
                        alert("Class has not started yet.");
                    }
                } catch (e) { console.error(e); }
            };
        }
        container.appendChild(div);
    });
}

function renderTimetableGrid(entries, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (entries.length === 0) {
        container.innerHTML = '<p>No schedule found.</p>';
        return;
    }

    // 1. Get Unique Time Slots
    const timeSlots = [...new Set(entries.map(e => `${e.startTime} - ${e.endTime}`))].sort();

    // 2. Build Grid Structure
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '10px';
    table.style.fontSize = '0.9rem';

    // Header Row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th style="padding:10px; border:1px solid var(--border); background:rgba(255,255,255,0.05)">Day / Time</th>';

    timeSlots.forEach(slot => {
        const th = document.createElement('th');
        th.style.padding = '10px';
        th.style.border = '1px solid var(--border)';
        th.style.background = 'rgba(255,255,255,0.05)';
        th.innerText = slot;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body Rows (Days)
    const tbody = document.createElement('tbody');
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    days.forEach(day => {
        const tr = document.createElement('tr');
        // Day Cell
        const tdDay = document.createElement('td');
        tdDay.style.padding = '10px';
        tdDay.style.border = '1px solid var(--border)';
        tdDay.style.fontWeight = 'bold';
        tdDay.innerText = day;
        tr.appendChild(tdDay);

        // Slot Cells
        timeSlots.forEach(slot => {
            const td = document.createElement('td');
            td.style.padding = '10px';
            td.style.border = '1px solid var(--border)';
            td.style.textAlign = 'center';

            // Find entry for this Day and Slot
            const entry = entries.find(e => e.dayOfWeek === day && `${e.startTime} - ${e.endTime}` === slot);
            if (entry) {
                td.innerHTML = `
                    <div style="font-weight:bold; color:var(--primary)">${entry.subject}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted)">${entry.faculty ? entry.faculty.fullName : 'N/A'}</div>
                    <button onclick="deleteTimetableEntry(${entry.id})" style="margin-top:4px; font-size:0.7rem; background:none; border:none; color:var(--error); cursor:pointer;">[Delete]</button>
                `;
            } else {
                td.innerHTML = '-';
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
}

window.deleteTimetableEntry = async (id) => {
    if (!confirm("Delete this schedule?")) return;
    try {
        const res = await fetch(`${API_BASE}/admin/timetable/${id}`, { method: 'DELETE' });
        if (res.ok) {
            // Reload HOD timetable since that's where we see it now
            loadTimetable('HOD');
        } else {
            alert("Failed to delete");
        }
    } catch (e) { console.error(e); }
};


// Student: Mark Attendance
const markBtn = document.getElementById('manual-mark-btn');
if (markBtn) {
    markBtn.addEventListener('click', () => {
        const sessionVal = document.getElementById('student-session-id').value;
        const tokenVal = document.getElementById('student-token').value;

        if (!sessionVal || !tokenVal) {
            alert("Please enter Session ID and Token");
            return;
        }

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const res = await fetch(`${API_BASE}/mark-attendance`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: sessionVal,
                        studentId: currentUser.id,
                        qrToken: tokenVal,
                        latitude: latitude,
                        longitude: longitude
                    })
                });

                const text = await res.text();
                if (res.ok) {
                    alert(text);
                    loadStudentHistory();
                } else {
                    alert("Attendance Failed: " + text);
                }
            } catch (e) {
                console.error(e);
                alert("Network Error");
            }
        }, (error) => {
            console.error(error);
            alert("Location access denied or failed. Please enable location.");
        }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    });
}

init();
