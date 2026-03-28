// ===== Firebase Services (will be populated from HTML) =====
let auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, collection, addDoc, query, where, getDocs;

// Wait for Firebase to initialize
function initializeFirebaseServices() {
    if (window.firebaseServices && window.firebaseServices.initialized) {
        auth = window.firebaseServices.auth;
        db = window.firebaseServices.db;
        createUserWithEmailAndPassword = window.firebaseServices.createUserWithEmailAndPassword;
        signInWithEmailAndPassword = window.firebaseServices.signInWithEmailAndPassword;
        collection = window.firebaseServices.collection;
        addDoc = window.firebaseServices.addDoc;
        query = window.firebaseServices.query;
        where = window.firebaseServices.where;
        getDocs = window.firebaseServices.getDocs;
        console.log('✅ Firebase services initialized in script.js');
        return true;
    }
    console.warn('⚠️ Firebase services not yet initialized');
    return false;
}

// Check if Firebase is ready
function waitForFirebase() {
    return new Promise((resolve) => {
        let attempts = 0;
        const checkInterval = setInterval(() => {
            if (initializeFirebaseServices()) {
                clearInterval(checkInterval);
                console.log('✅ Firebase ready');
                resolve();
            }
            attempts++;
            if (attempts > 100) {
                clearInterval(checkInterval);
                console.error('❌ Firebase initialization timeout');
                if (window.firebaseServices && window.firebaseServices.error) {
                    console.error('Error details:', window.firebaseServices.error);
                }
                resolve();
            }
        }, 50);
    });
}

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
        return id.trim().length > 0;
    }

    static validatePAN(pan) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return panRegex.test(pan);
    }
}

// ===== UI Helper Functions =====
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    smoothScrollTo(sectionId);
}

function showFormContainer(containerId) {
    document.querySelectorAll('.form-container').forEach(container => {
        container.classList.remove('active');
    });
    document.getElementById(containerId).classList.add('active');
    smoothScrollTo(containerId);
}

function showMessage(elementId, message, type = 'error') {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.className = `form-message show ${type}`;
    setTimeout(() => {
        messageElement.classList.remove('show');
    }, 4000);
}

function showSuccessModal(title, message) {
    document.getElementById('successTitle').textContent = title;
    document.getElementById('successMessage').textContent = message;
    document.getElementById('successModal').classList.add('show');
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('show');
    backToLanding();
}

function showLoading() {
    document.getElementById('loadingSpinner').classList.add('show');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.remove('show');
}

// ===== Smooth Scroll Function =====
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        setTimeout(() => {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// ===== Navigation Functions =====
function selectVolunteer() {
    showSection('volunteerSection');
    showFormContainer('volunteerLoginForm');
    activateTab('volunteer', 'login');
}

function selectFoundation() {
    showSection('foundationSection');
    showFormContainer('foundationLoginForm');
    activateTab('foundation', 'login');
}

function backToLanding() {
    showSection('landingSection');
    scrollToTop();
    clearAllForms();
}

function activateTab(type, form) {
    if (type === 'volunteer') {
        const tabs = document.querySelectorAll('#volunteerSection .tab-btn');
        tabs.forEach(tab => tab.classList.remove('active'));
        if (form === 'login') {
            tabs[0].classList.add('active');
        } else {
            tabs[1].classList.add('active');
        }
    } else {
        const tabs = document.querySelectorAll('#foundationSection .tab-btn');
        tabs.forEach(tab => tab.classList.remove('active'));
        if (form === 'login') {
            tabs[0].classList.add('active');
        } else {
            tabs[1].classList.add('active');
        }
    }
}

// ===== Volunteer Functions =====
function showVolunteerLogin() {
    showFormContainer('volunteerLoginForm');
    activateTab('volunteer', 'login');
    clearVolunteerForms();
}

function showVolunteerRegister() {
    showFormContainer('volunteerRegisterForm');
    activateTab('volunteer', 'register');
    clearVolunteerForms();
}

function clearVolunteerForms() {
    document.getElementById('vol-login-email').value = '';
    document.getElementById('vol-login-password').value = '';
    document.getElementById('vol-reg-name').value = '';
    document.getElementById('vol-reg-email').value = '';
    document.getElementById('vol-reg-phone').value = '';
    document.getElementById('vol-reg-locality').value = '';
    document.getElementById('vol-reg-password').value = '';
    document.getElementById('volunteerLoginMessage').classList.remove('show');
    document.getElementById('volunteerRegisterMessage').classList.remove('show');
}

async function handleVolunteerLogin(event) {
    event.preventDefault();

    // Check if Firebase is initialized
    if (!db || !signInWithEmailAndPassword || !auth) {
        showMessage('volunteerLoginMessage', 'System is loading. Please wait a moment and try again.', 'error');
        console.error('Firebase not initialized:', { db: !!db, signInWithEmailAndPassword: !!signInWithEmailAndPassword, auth: !!auth });
        return;
    }

    const email = document.getElementById('vol-login-email').value.trim();
    const password = document.getElementById('vol-login-password').value;

    // Validation
    if (!email || !password) {
        showMessage('volunteerLoginMessage', 'Please fill in all fields', 'error');
        return;
    }

    if (!Validator.validateEmail(email)) {
        showMessage('volunteerLoginMessage', 'Please enter a valid email', 'error');
        return;
    }

    showLoading();

    try {
        console.log('Attempting login with email:', email);
        
        // Firebase sign in
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log('✅ User signed in:', user.uid);

        // Query Firestore for volunteer data
        const volunteersRef = collection(db, 'volunteers');
        const q = query(volunteersRef, where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const volunteerData = querySnapshot.docs[0].data();
            console.log('✅ Volunteer data found:', volunteerData.name);
            hideLoading();
            clearVolunteerForms();
            showSuccessModal('Welcome Back!', `Login successful! Welcome ${volunteerData.name}`);
        } else {
            console.warn('⚠️ Volunteer profile not found in Firestore');
            hideLoading();
            showMessage('volunteerLoginMessage', 'Your profile is not in our system. Please register first.', 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('❌ Login error:', error.code, error.message);
        
        if (error.code === 'auth/user-not-found') {
            showMessage('volunteerLoginMessage', 'No account found with this email. Please register first.', 'error');
        } else if (error.code === 'auth/wrong-password') {
            showMessage('volunteerLoginMessage', 'Incorrect password. Please try again.', 'error');
        } else if (error.code === 'auth/invalid-email') {
            showMessage('volunteerLoginMessage', 'Invalid email format', 'error');
        } else if (error.code === 'auth/too-many-requests') {
            showMessage('volunteerLoginMessage', 'Too many failed login attempts. Try again later.', 'error');
        } else {
            showMessage('volunteerLoginMessage', error.message || 'Login failed', 'error');
        }
    }
}

async function handleVolunteerRegister(event) {
    event.preventDefault();

    // Check if Firebase is initialized
    if (!db || !createUserWithEmailAndPassword || !addDoc) {
        showMessage('volunteerRegisterMessage', 'Firebase is still loading. Please try again in a moment.', 'error');
        return;
    }

    const name = document.getElementById('vol-reg-name').value.trim();
    const email = document.getElementById('vol-reg-email').value.trim();
    const phone = document.getElementById('vol-reg-phone').value.trim();
    const locality = document.getElementById('vol-reg-locality').value.trim();
    const password = document.getElementById('vol-reg-password').value;

    // Validation
    if (!name || !email || !locality || !password) {
        showMessage('volunteerRegisterMessage', 'Please fill in all required fields', 'error');
        return;
    }

    if (!Validator.validateEmail(email)) {
        showMessage('volunteerRegisterMessage', 'Please enter a valid email', 'error');
        return;
    }

    if (!Validator.validatePassword(password)) {
        showMessage('volunteerRegisterMessage', 'Password must be at least 6 characters', 'error');
        return;
    }

    if (phone && !Validator.validatePhone(phone)) {
        showMessage('volunteerRegisterMessage', 'Phone number must be 10 digits', 'error');
        return;
    }

    showLoading();

    try {
        // Create Firebase user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save volunteer data to Firestore
        const volunteerData = {
            uid: user.uid,
            name,
            email,
            phone: phone || 'Not provided',
            locality,
            registeredAt: new Date().toISOString(),
            userType: 'volunteer'
        };

        // Add document to Firestore "volunteers" collection
        await addDoc(collection(db, 'volunteers'), volunteerData);

        hideLoading();
        clearVolunteerForms();
        showSuccessModal('Registration Successful!', `Welcome ${name}! Your account has been created. You can now login.`);
    } catch (error) {
        hideLoading();
        console.error('Registration error:', error);
        
        if (error.code === 'auth/email-already-in-use') {
            showMessage('volunteerRegisterMessage', 'Email already registered', 'error');
        } else if (error.code === 'auth/weak-password') {
            showMessage('volunteerRegisterMessage', 'Password is too weak', 'error');
        } else if (error.code === 'auth/invalid-email') {
            showMessage('volunteerRegisterMessage', 'Invalid email format', 'error');
        } else if (error.message && error.message.includes('PERMISSION_DENIED')) {
            showMessage('volunteerRegisterMessage', 'Permission denied. Please check your Firestore rules.', 'error');
        } else {
            showMessage('volunteerRegisterMessage', error.message || 'Registration failed', 'error');
        }
    }
}

// ===== Foundation Functions =====
function showFoundationLogin() {
    showFormContainer('foundationLoginForm');
    activateTab('foundation', 'login');
    clearFoundationForms();
}

function showFoundationRegister() {
    showFormContainer('foundationRegisterForm');
    activateTab('foundation', 'register');
    clearFoundationForms();
}

function clearFoundationForms() {
    document.getElementById('found-login-id').value = '';
    document.getElementById('found-login-password').value = '';
    document.getElementById('found-reg-name').value = '';
    document.getElementById('found-reg-darpan').value = '';
    document.getElementById('found-reg-pan').value = '';
    document.getElementById('found-reg-certificate').value = '';
    document.getElementById('found-reg-password').value = '';
    document.getElementById('foundationLoginMessage').classList.remove('show');
    document.getElementById('foundationRegisterMessage').classList.remove('show');
}

async function handleFoundationLogin(event) {
    event.preventDefault();

    // Check if Firebase is initialized
    if (!db || !signInWithEmailAndPassword || !auth) {
        showMessage('foundationLoginMessage', 'System is loading. Please wait a moment and try again.', 'error');
        console.error('Firebase not initialized');
        return;
    }

    const idOrEmail = document.getElementById('found-login-id').value.trim();
    const password = document.getElementById('found-login-password').value;

    // Validation
    if (!idOrEmail || !password) {
        showMessage('foundationLoginMessage', 'Please fill in all fields', 'error');
        return;
    }

    showLoading();

    try {
        console.log('Attempting foundation login with:', idOrEmail);
        
        // Try to sign in with email first
        const userCredential = await signInWithEmailAndPassword(auth, idOrEmail, password);
        const user = userCredential.user;

        console.log('✅ User signed in:', user.uid);

        // Query Firestore for foundation data
        const foundationsRef = collection(db, 'foundations');
        const q = query(foundationsRef, where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const foundationData = querySnapshot.docs[0].data();
            console.log('✅ Foundation data found:', foundationData.name);
            hideLoading();
            clearFoundationForms();
            showSuccessModal('Welcome Back!', `Login successful! Welcome ${foundationData.name}`);
        } else {
            console.warn('⚠️ Foundation profile not found');
            hideLoading();
            showMessage('foundationLoginMessage', 'Your profile is not in our system.', 'error');
        }
    } catch (error) {
        console.error('❌ Email login failed, trying Darpan ID:', error.code);
        
        // If email sign-in fails, try searching by Darpan ID
        try {
            const foundationsRef = collection(db, 'foundations');
            const q = query(foundationsRef, where('darpanId', '==', idOrEmail.toUpperCase()));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const foundationData = querySnapshot.docs[0].data();
                
                // Verify password
                if (foundationData.password === password) {
                    console.log('✅ Foundation login successful via Darpan ID');
                    hideLoading();
                    clearFoundationForms();
                    showSuccessModal('Welcome Back!', `Login successful! Welcome ${foundationData.name}`);
                } else {
                    console.warn('❌ Password mismatch');
                    hideLoading();
                    showMessage('foundationLoginMessage', 'Incorrect password', 'error');
                }
            } else {
                console.warn('⚠️ No foundation found with Darpan ID');
                hideLoading();
                showMessage('foundationLoginMessage', 'Foundation account not found. Please register first.', 'error');
            }
        } catch (innerError) {
            hideLoading();
            console.error('❌ Foundation login error:', innerError);
            
            // Show appropriate error based on the first attempt
            if (error.code === 'auth/user-not-found') {
                showMessage('foundationLoginMessage', 'No account found. Please register first.', 'error');
            } else if (error.code === 'auth/wrong-password') {
                showMessage('foundationLoginMessage', 'Incorrect password', 'error');
            } else if (error.code === 'auth/invalid-email') {
                showMessage('foundationLoginMessage', 'Invalid email format', 'error');
            } else {
                showMessage('foundationLoginMessage', 'Login failed. Please check your credentials.', 'error');
            }
        }
    }
}

async function handleFoundationRegister(event) {
    event.preventDefault();

    // Check if Firebase is initialized
    if (!db || !createUserWithEmailAndPassword || !addDoc) {
        showMessage('foundationRegisterMessage', 'Firebase is still loading. Please try again in a moment.', 'error');
        return;
    }

    const name = document.getElementById('found-reg-name').value.trim();
    const darpanId = document.getElementById('found-reg-darpan').value.trim();
    const pan = document.getElementById('found-reg-pan').value.trim();
    const certificate = document.getElementById('found-reg-certificate').files[0];
    const password = document.getElementById('found-reg-password').value;

    // Validation
    if (!name || !darpanId || !pan || !certificate || !password) {
        showMessage('foundationRegisterMessage', 'Please fill in all required fields', 'error');
        return;
    }

    if (!Validator.validateDarpanId(darpanId)) {
        showMessage('foundationRegisterMessage', 'Please enter a valid NGO Darpan ID', 'error');
        return;
    }

    if (!Validator.validatePAN(pan.toUpperCase())) {
        showMessage('foundationRegisterMessage', 'Please enter a valid PAN (e.g., AAATL1234A)', 'error');
        return;
    }

    if (!Validator.validatePassword(password)) {
        showMessage('foundationRegisterMessage', 'Password must be at least 6 characters', 'error');
        return;
    }

    // Check file size (5MB max)
    if (certificate.size > 5 * 1024 * 1024) {
        showMessage('foundationRegisterMessage', 'Certificate file must be less than 5MB', 'error');
        return;
    }

    showLoading();

    try {
        // Create temporary email for foundation registration
        const tempEmail = `foundation_${darpanId.toLowerCase()}@careconnect.ngo`;

        // Create Firebase user
        const userCredential = await createUserWithEmailAndPassword(auth, tempEmail, password);
        const user = userCredential.user;

        // Save foundation data to Firestore
        const foundationData = {
            uid: user.uid,
            name,
            darpanId: darpanId.toUpperCase(),
            pan: pan.toUpperCase(),
            email: tempEmail,
            password,
            certificate: {
                name: certificate.name,
                size: certificate.size,
                type: certificate.type,
                uploadedAt: new Date().toISOString()
            },
            registeredAt: new Date().toISOString(),
            userType: 'foundation',
            verificationStatus: 'pending'
        };

        // Add document to Firestore "foundations" collection
        await addDoc(collection(db, 'foundations'), foundationData);

        hideLoading();
        clearFoundationForms();
        showSuccessModal('Registration Successful!', `Welcome ${name}! Your foundation has been registered. You can now login using your NGO Darpan ID or email.`);
    } catch (error) {
        hideLoading();
        console.error('Foundation registration error:', error);
        
        if (error.code === 'auth/email-already-in-use') {
            showMessage('foundationRegisterMessage', 'This Darpan ID is already registered', 'error');
        } else if (error.code === 'auth/weak-password') {
            showMessage('foundationRegisterMessage', 'Password is too weak', 'error');
        } else if (error.message && error.message.includes('PERMISSION_DENIED')) {
            showMessage('foundationRegisterMessage', 'Permission denied. Please check your Firestore rules.', 'error');
        } else {
            showMessage('foundationRegisterMessage', error.message || 'Registration failed', 'error');
        }
    }
}

function clearAllForms() {
    clearVolunteerForms();
    clearFoundationForms();
}

// ===== Initialize on Page Load =====
document.addEventListener('DOMContentLoaded', async function() {
    await waitForFirebase();
    console.log('Firebase initialized successfully');
});
