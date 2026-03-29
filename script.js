// ===== Validation Functions =====
class Validator {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePassword(password) {
        return password.length >= 6;
    }

    static validatePhone(phone) {
        return phone === '' || /^\d{10}$/.test(phone);
    }

    static validateDarpanId(id) {
        return /^[A-Z]{2}\/\d{4}\/\d{7}$/.test((id || '').trim().toUpperCase());
    }
}

// ===== UI Helper Functions =====
function showMessage(elementId, message, type = 'error') {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `verify-status show ${type}`;
        setTimeout(() => {
            messageElement.classList.remove('show');
        }, 4000);
    }
}

function showLoading() {
    console.log('Loading...');
}

function hideLoading() {
    console.log('Loading complete');
}

// ===== Volunteer Login Handler =====
async function handleVolunteerLogin(email, password) {
    if (!email || !password) {
        showMessage('volunteerStatus', 'Please fill in all fields', 'error');
        return;
    }

    if (!Validator.validateEmail(email)) {
        showMessage('volunteerStatus', 'Please enter a valid email', 'error');
        return;
    }

    showLoading();

    try {
        const volunteer = await window.mockAuth.loginVolunteer(email, password);
        console.log('✅ Volunteer signed in:', volunteer.uid);
        
        document.getElementById('headerLoginState').textContent = `Logged in as Volunteer (${volunteer.name})`;
        document.getElementById('authTrigger').textContent = 'Logout';
        
        sessionStorage.setItem('currentUser', JSON.stringify({
            uid: volunteer.uid,
            role: 'volunteer',
            name: volunteer.name,
            email: volunteer.email
        }));

        hideLoading();
        closeModal();
        showMessage('volunteerStatus', `Welcome back, ${volunteer.name}!`, 'success');
        setTimeout(() => {
            redirectToRoleHome({ role: 'volunteer' });
        }, 300);
    } catch (error) {
        hideLoading();
        console.error('❌ Volunteer login error:', error.message);
        showMessage('volunteerStatus', error.message || 'Login failed', 'error');
    }
}

// ===== Volunteer Register Handler =====
async function handleVolunteerRegister(name, email, phone, password) {
    if (!name || !email || !password) {
        showMessage('volunteerRegisterStatus', 'Please fill in all required fields', 'error');
        return;
    }

    if (!Validator.validateEmail(email)) {
        showMessage('volunteerRegisterStatus', 'Please enter a valid email', 'error');
        return;
    }

    if (!Validator.validatePassword(password)) {
        showMessage('volunteerRegisterStatus', 'Password must be at least 6 characters', 'error');
        return;
    }

    if (phone && !Validator.validatePhone(phone)) {
        showMessage('volunteerRegisterStatus', 'Phone number must be 10 digits', 'error');
        return;
    }

    showLoading();

    try {
        const volunteer = await window.mockAuth.registerVolunteer(name, email, phone, password);
        hideLoading();
        showMessage('volunteerRegisterStatus', `Welcome ${name}! Your account has been created. You can now login.`, 'success');
        
        setTimeout(() => {
            document.getElementById('volunteerForm').style.display = 'block';
            document.getElementById('volunteerRegisterForm').style.display = 'none';
            document.getElementById('toggleVolunteerForms').textContent = 'Create new volunteer account';
            document.getElementById('volunteerForm').reset();
            document.getElementById('volunteerRegisterForm').reset();
        }, 1500);
    } catch (error) {
        hideLoading();
        console.error('❌ Volunteer registration error:', error.message);
        showMessage('volunteerRegisterStatus', error.message || 'Registration failed', 'error');
    }
}

// ===== Foundation Login Handler =====
async function handleFoundationLogin(email, password) {
    if (!email || !password) {
        showMessage('foundationLoginStatus', 'Please fill in all fields', 'error');
        return;
    }

    if (!Validator.validateEmail(email)) {
        showMessage('foundationLoginStatus', 'Please enter a valid email', 'error');
        return;
    }

    showLoading();

    try {
        const foundation = await window.mockAuth.loginFoundation(email, password);
        console.log('✅ Foundation signed in:', foundation.uid);

        document.getElementById('headerLoginState').textContent = `Logged in as Foundation (${foundation.name})`;
        document.getElementById('authTrigger').textContent = 'Logout';
        
        sessionStorage.setItem('currentUser', JSON.stringify({
            uid: foundation.uid,
            role: 'foundation',
            name: foundation.name,
            email: foundation.email,
            darpanId: foundation.darpanId
        }));

        hideLoading();
        closeModal();
        showMessage('foundationLoginStatus', `Welcome back, ${foundation.name}!`, 'success');
        setTimeout(() => {
            redirectToRoleHome({ role: 'foundation' });
        }, 300);
    } catch (error) {
        hideLoading();
        console.error('❌ Foundation login error:', error.message);
        showMessage('foundationLoginStatus', error.message || 'Login failed', 'error');
    }
}

// ===== Foundation Register Handler =====
async function handleFoundationRegister(name, darpanId, email, password) {
    if (!name || !darpanId || !email || !password) {
        showMessage('foundationRegisterStatus', 'Please fill in all required fields', 'error');
        return;
    }

    if (!Validator.validateDarpanId(darpanId)) {
        showMessage('foundationRegisterStatus', 'Please enter a valid Darpan ID (format: ST/2024/1234567)', 'error');
        return;
    }

    if (!Validator.validateEmail(email)) {
        showMessage('foundationRegisterStatus', 'Please enter a valid email', 'error');
        return;
    }

    if (!Validator.validatePassword(password)) {
        showMessage('foundationRegisterStatus', 'Password must be at least 6 characters', 'error');
        return;
    }

    showLoading();

    try {
        const foundation = await window.mockAuth.registerFoundation(name, darpanId, email, password);
        hideLoading();
        showMessage('foundationRegisterStatus', `Welcome ${name}! Your foundation has been registered. You can now login.`, 'success');
        
        setTimeout(() => {
            document.getElementById('foundationLoginForm').style.display = 'block';
            document.getElementById('foundationRegisterForm').style.display = 'none';
            document.getElementById('toggleFoundationForms').textContent = 'Create new foundation account';
            document.getElementById('foundationLoginForm').reset();
            document.getElementById('foundationRegisterForm').reset();
        }, 1500);
    } catch (error) {
        hideLoading();
        console.error('❌ Foundation registration error:', error.message);
        showMessage('foundationRegisterStatus', error.message || 'Registration failed', 'error');
    }
}

// ===== Modal Functions =====
const authTrigger = document.getElementById("authTrigger");
const authModal = document.getElementById("authModal");
const closeAuth = document.getElementById("closeAuth");
const volunteerOption = document.getElementById("volunteerOption");
const foundationOption = document.getElementById("foundationOption");
const choiceView = document.getElementById("choiceView");
const volunteerView = document.getElementById("volunteerView");
const foundationView = document.getElementById("foundationView");
const backButtons = document.querySelectorAll("[data-back='true']");
const headerLoginState = document.getElementById("headerLoginState");
const goDashboardBtn = document.getElementById("goDashboard");

let currentUser = null;
let logoutClickGuard = false;

function redirectToRoleHome(user) {
    if (!user || !user.role) {
        return;
    }
    if (user.role === 'volunteer') {
        window.location.href = 'volunteer-home.html';
        return;
    }
    if (user.role === 'foundation') {
        window.location.href = 'ngo-home.html';
    }
}

function showModal() {
    authModal.classList.add("show");
    authModal.setAttribute("aria-hidden", "false");
    showChoiceView();
}

function closeModal() {
    authModal.classList.remove("show");
    authModal.setAttribute("aria-hidden", "true");
}

function showChoiceView() {
    choiceView.classList.remove("hidden");
    volunteerView.classList.add("hidden");
    foundationView.classList.add("hidden");
    document.getElementById('volunteerStatus').textContent = '';
    document.getElementById('foundationLoginStatus').textContent = '';
    document.getElementById('foundationRegisterStatus').textContent = '';
}

function showVolunteerView() {
    choiceView.classList.add("hidden");
    volunteerView.classList.remove("hidden");
    foundationView.classList.add("hidden");
    document.getElementById('volunteerStatus').textContent = '';
}

function showFoundationView() {
    choiceView.classList.add("hidden");
    volunteerView.classList.add("hidden");
    foundationView.classList.remove("hidden");
    document.getElementById('foundationLoginStatus').textContent = '';
}

function updateHeaderState() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    if (user) {
        const role = user.role === 'foundation' ? 'Foundation' : 'Volunteer';
        const namePart = user.name ? ` (${user.name})` : '';
        headerLoginState.textContent = `Logged in as ${role}${namePart}`;
        authTrigger.textContent = 'Logout';
        currentUser = user;
    } else {
        headerLoginState.textContent = 'Not logged in';
        authTrigger.textContent = 'Login';
        currentUser = null;
    }
}

// Event Listeners
authTrigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (logoutClickGuard) {
        return;
    }

    if (currentUser) {
        logoutClickGuard = true;
        fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        }).catch(() => null).finally(() => {
            sessionStorage.removeItem('currentUser');
            updateHeaderState();
            closeModal();
            setTimeout(() => {
                logoutClickGuard = false;
            }, 300);
        });
        return;
    } else {
        showModal();
    }
});

closeAuth.addEventListener("click", closeModal);

authModal.addEventListener("click", (event) => {
    if (event.target.dataset.close === "true") {
        closeModal();
    }
});

volunteerOption.addEventListener("click", showVolunteerView);
foundationOption.addEventListener("click", showFoundationView);

backButtons.forEach((button) => {
    button.addEventListener("click", showChoiceView);
});

if (goDashboardBtn) {
    goDashboardBtn.addEventListener('click', () => {
        const user = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
        if (!user) {
            showModal();
            return;
        }
        redirectToRoleHome(user);
    });
}

// Volunteer Login Form
const volunteerForm = document.getElementById("volunteerForm");
if (volunteerForm) {
    volunteerForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const email = document.getElementById("volEmail").value.trim();
        const password = document.getElementById("volPassword").value;
        handleVolunteerLogin(email, password);
    });
}

// Volunteer Register Form
const volunteerRegisterForm = document.getElementById("volunteerRegisterForm");
if (volunteerRegisterForm) {
    volunteerRegisterForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const name = document.getElementById("volRegName").value.trim();
        const email = document.getElementById("volRegEmail").value.trim();
        const phone = document.getElementById("volRegPhone").value.trim();
        const password = document.getElementById("volRegPassword").value;
        handleVolunteerRegister(name, email, phone, password);
    });
}

// Toggle Volunteer Forms
const toggleVolunteerBtn = document.getElementById('toggleVolunteerForms');
if (toggleVolunteerBtn) {
    toggleVolunteerBtn.addEventListener('click', () => {
        const loginForm = document.getElementById('volunteerForm');
        const registerForm = document.getElementById('volunteerRegisterForm');
        
        if (loginForm.style.display === 'none') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            toggleVolunteerBtn.textContent = 'Create new volunteer account';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            toggleVolunteerBtn.textContent = 'Already have an account? Login';
        }
    });
}

// Foundation Login Form
const foundationLoginForm = document.getElementById("foundationLoginForm");
if (foundationLoginForm) {
    foundationLoginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const email = document.getElementById("foundEmail").value.trim();
        const password = document.getElementById("foundPassword").value;
        handleFoundationLogin(email, password);
    });
}

// Foundation Register Form
const foundationRegisterForm = document.getElementById("foundationRegisterForm");
if (foundationRegisterForm) {
    foundationRegisterForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const name = document.getElementById("foundRegName").value.trim();
        const darpanId = document.getElementById("foundRegDarpan").value.trim();
        const email = document.getElementById("foundRegEmail").value.trim();
        const password = document.getElementById("foundRegPassword").value;
        handleFoundationRegister(name, darpanId, email, password);
    });
}

// Toggle Foundation Forms
const toggleFoundationBtn = document.getElementById('toggleFoundationForms');
if (toggleFoundationBtn) {
    toggleFoundationBtn.addEventListener('click', () => {
        const loginForm = document.getElementById('foundationLoginForm');
        const registerForm = document.getElementById('foundationRegisterForm');
        
        if (loginForm.style.display === 'none') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            toggleFoundationBtn.textContent = 'Create new foundation account';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            toggleFoundationBtn.textContent = 'Already have an account? Login';
        }
    });
}

// Handle Escape key
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && authModal.classList.contains("show")) {
        closeModal();
    }
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.protocol === "file:") {
        alert("This app must run from http://localhost:3000 for login to work. Open that URL after starting the server.");
    }
    console.log('🚀 Page loaded, initializing auth...');
    updateHeaderState();
    console.log('✅ Auth initialized successfully');
});
