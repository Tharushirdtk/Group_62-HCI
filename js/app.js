const AppState = {
    currentUser: null,
    currentDesign: null,
    selectedItemId: null
};

// DOM Elements
const views = {
    login: document.getElementById('login-view'),
    register: document.getElementById('register-view'),
    dashboard: document.getElementById('dashboard-view'),
    editor: document.getElementById('editor-view')
};

// UI Feedback
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Routing
function navigateTo(viewName) {
    Object.values(views).forEach(el => el.classList.add('hidden'));
    views[viewName].classList.remove('hidden');

    if (viewName === 'dashboard') {
        renderDashboard();
    } else if (viewName === 'editor') {
        // Init editor layout fixes if needed
        window.dispatchEvent(new Event('resize'));
        if (typeof Canvas2D !== 'undefined') Canvas2D.resize();
        if (typeof Scene3D !== 'undefined') Scene3D.resize();
    }
}

// Authentication Flow
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (username && password) {
        const result = Storage.login(username, password);
        if (result.success) {
            AppState.currentUser = username;
            updateAuthUI();
            navigateTo('dashboard');
            showToast(`Welcome back, ${username}!`);
        } else {
            showToast(result.message);
        }
    } else {
        showToast('Please enter username and password');
    }
});

document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    if (username && password) {
        const result = Storage.register(username, password);
        if (result.success) {
            AppState.currentUser = username;
            updateAuthUI();
            navigateTo('dashboard');
            showToast(`Account created, welcome ${username}!`);
        } else {
            showToast(result.message);
        }
    } else {
        showToast('Please enter username and password');
    }
});

document.getElementById('link-to-register').addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('register');
});

document.getElementById('link-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('login');
});

document.getElementById('btn-logout').addEventListener('click', () => {
    Storage.logout();
    AppState.currentUser = null;
    updateAuthUI();
    navigateTo('login');
});

function updateAuthUI() {
    const userLabel = document.getElementById('current-user');
    const btnLogout = document.getElementById('btn-logout');

    if (AppState.currentUser) {
        userLabel.textContent = AppState.currentUser;
        userLabel.classList.remove('hidden');
        btnLogout.classList.remove('hidden');
    } else {
        userLabel.classList.add('hidden');
        btnLogout.classList.add('hidden');
    }
}

// Dashboard Flow
function renderDashboard() {
    const grid = document.getElementById('design-grid');
    grid.innerHTML = '';

    const designs = Storage.getUserDesigns(AppState.currentUser);

    if (designs.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No designs yet. Create one!</p>';
        return;
    }

    designs.forEach(design => {
        const card = document.createElement('div');
        card.className = 'glass-panel design-card';
        card.innerHTML = `
            <div class="design-card-title">${design.name}</div>
            <div class="design-card-meta">
                ${design.room.width}m x ${design.room.depth}m | ${design.items.length} Items<br>
                Last edited: ${new Date(design.updatedAt).toLocaleDateString()}
            </div>
            <div class="design-card-actions">
                <button class="btn btn-secondary btn-icon btn-edit" title="Edit Design" data-id="${design.id}">✏️</button>
                <button class="btn btn-danger btn-icon btn-delete" title="Delete Design" data-id="${design.id}">🗑</button>
            </div>
        `;

        
        const btnEdit = card.querySelector('.btn-edit');
        const btnDelete = card.querySelector('.btn-delete');

        btnEdit.addEventListener('click', () => loadDesign(design.id));
        btnDelete.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete "${design.name}"?`)) {
                Storage.deleteDesign(AppState.currentUser, design.id);
                renderDashboard();
                showToast('Design deleted');
            }
        });

        
        card.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                loadDesign(design.id);
            }
        });

        grid.appendChild(card);
    });
}

// Feedback Flow
document.getElementById('btn-feedback')?.addEventListener('click', () => {
    document.getElementById('feedback-modal').classList.remove('hidden');
});
document.getElementById('btn-close-feedback')?.addEventListener('click', () => {
    document.getElementById('feedback-modal').classList.add('hidden');
});
document.getElementById('feedback-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('feedback-type').value;
    const message = document.getElementById('feedback-message').value.trim();
    if (message) {
        
        console.log(`Feedback submitted [${type}]:`, message);
        document.getElementById('feedback-modal').classList.add('hidden');
        document.getElementById('feedback-message').value = '';
        showToast('Thank you for your feedback!');
    }
});

// Editor Transitions
document.getElementById('btn-create-living')?.addEventListener('click', () => {
    AppState.currentDesign = Storage.createLivingRoomDesign();
    initEditorUI();
    navigateTo('editor');
});

document.getElementById('btn-create-bed')?.addEventListener('click', () => {
    AppState.currentDesign = Storage.createBedRoomDesign();
    initEditorUI();
    navigateTo('editor');
});

document.getElementById('btn-create-empty')?.addEventListener('click', () => {
    AppState.currentDesign = Storage.createEmptyDesign();
    initEditorUI();
    navigateTo('editor');
});

document.getElementById('btn-back-dashboard').addEventListener('click', () => {
    if (confirm("Any unsaved changes will be lost. Return to dashboard?")) {
        AppState.currentDesign = null;
        navigateTo('dashboard');
    }
});

function loadDesign(id) {
    const data = Storage.getDesign(AppState.currentUser, id);
    if (data) {
        AppState.currentDesign = JSON.parse(JSON.stringify(data));
        initEditorUI();
        navigateTo('editor');
    }
}

// Init App
function initApp() {
    const savedUser = Storage.getCurrentUser();
    if (savedUser) {
        AppState.currentUser = savedUser;
        updateAuthUI();
        navigateTo('dashboard');
    } else {
        navigateTo('login');
    }
}


// Export for other scripts
window.App = {
    state: AppState,
    toast: showToast,
    navigate: navigateTo
};


document.addEventListener('DOMContentLoaded', initApp);
