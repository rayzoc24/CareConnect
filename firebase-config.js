// ===== Local auth with optional Firestore sync =====
console.log('✅ Auth system initialized (localStorage + optional Firestore sync)');

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

let firestoreDb = null;

function initializeFirebaseBridge() {
    try {
        if (typeof window.firebase === 'undefined') {
            console.warn('ℹ️ Firebase SDK not loaded. Using localStorage only.');
            return;
        }

        const cfg = window.CARECONNECT_FIREBASE_CONFIG;
        if (!cfg || !cfg.apiKey || !cfg.projectId) {
            console.warn('ℹ️ CARECONNECT_FIREBASE_CONFIG missing. Firestore sync disabled.');
            return;
        }

        if (!firebase.apps.length) {
            firebase.initializeApp(cfg);
        }

        firestoreDb = firebase.firestore();
        console.log('✅ Firestore sync enabled');
    } catch (error) {
        console.error('❌ Firestore init failed:', error.message);
        firestoreDb = null;
    }
}

function syncUserToFirestore(collection, user) {
    if (!firestoreDb || !user || !user.uid) {
        return;
    }

    const safeData = {
        uid: user.uid,
        name: user.name || '',
        email: normalizeEmail(user.email),
        userType: user.userType || '',
        registeredAt: user.registeredAt || new Date().toISOString()
    };

    if (user.phone) {
        safeData.phone = user.phone;
    }
    if (user.darpanId) {
        safeData.darpanId = user.darpanId;
    }
    if (user.verificationStatus) {
        safeData.verificationStatus = user.verificationStatus;
    }

    firestoreDb.collection(collection).doc(user.uid).set(safeData, { merge: true })
        .then(() => {
            console.log(`✅ Synced ${collection}/${user.uid} to Firestore`);
        })
        .catch((error) => {
            console.error(`❌ Failed syncing ${collection}/${user.uid}:`, error.message);
        });
}

function logLoginEvent(user) {
    if (!firestoreDb || !user || !user.uid) {
        return;
    }

    firestoreDb.collection('loginEvents').add({
        uid: user.uid,
        email: normalizeEmail(user.email),
        role: user.userType,
        loggedAt: new Date().toISOString()
    }).catch((error) => {
        console.error('❌ Failed writing login event:', error.message);
    });
}

window.mockAuth = {
    volunteers: [],
    foundations: [],

    registerVolunteer(name, email, phone, password) {
        const normalizedEmail = normalizeEmail(email);
        if (this.volunteers.some(v => normalizeEmail(v.email) === normalizedEmail)) {
            throw new Error('Email already registered');
        }

        const volunteer = {
            uid: 'vol_' + Date.now(),
            name,
            email: normalizedEmail,
            phone,
            password,
            registeredAt: new Date().toISOString(),
            userType: 'volunteer'
        };

        this.volunteers.push(volunteer);
        localStorage.setItem('volunteers', JSON.stringify(this.volunteers));
        syncUserToFirestore('volunteers', volunteer);
        return volunteer;
    },

    loginVolunteer(email, password) {
        const normalizedEmail = normalizeEmail(email);
        const volunteer = this.volunteers.find(v => normalizeEmail(v.email) === normalizedEmail);
        if (!volunteer) {
            throw new Error('Volunteer not found');
        }
        if (volunteer.password !== password) {
            throw new Error('Incorrect password');
        }
        syncUserToFirestore('volunteers', volunteer);
        logLoginEvent(volunteer);
        return volunteer;
    },

    registerFoundation(name, darpanId, email, password) {
        const normalizedEmail = normalizeEmail(email);
        if (this.foundations.some(f => normalizeEmail(f.email) === normalizedEmail)) {
            throw new Error('Email already registered');
        }

        const foundation = {
            uid: 'found_' + Date.now(),
            name,
            darpanId: darpanId.toUpperCase(),
            email: normalizedEmail,
            password,
            registeredAt: new Date().toISOString(),
            userType: 'foundation',
            verificationStatus: 'pending'
        };

        this.foundations.push(foundation);
        localStorage.setItem('foundations', JSON.stringify(this.foundations));
        syncUserToFirestore('foundations', foundation);
        return foundation;
    },

    loginFoundation(email, password) {
        const normalizedEmail = normalizeEmail(email);
        const foundation = this.foundations.find(f => normalizeEmail(f.email) === normalizedEmail);
        if (!foundation) {
            throw new Error('Foundation not found');
        }
        if (foundation.password !== password) {
            throw new Error('Incorrect password');
        }
        syncUserToFirestore('foundations', foundation);
        logLoginEvent(foundation);
        return foundation;
    }
};

if (localStorage.getItem('volunteers')) {
    window.mockAuth.volunteers = JSON.parse(localStorage.getItem('volunteers'));
}
if (localStorage.getItem('foundations')) {
    window.mockAuth.foundations = JSON.parse(localStorage.getItem('foundations'));
}

window.mockAuth.volunteers = window.mockAuth.volunteers.map(v => ({
    ...v,
    email: normalizeEmail(v.email)
}));
window.mockAuth.foundations = window.mockAuth.foundations.map(f => ({
    ...f,
    email: normalizeEmail(f.email)
}));

localStorage.setItem('volunteers', JSON.stringify(window.mockAuth.volunteers));
localStorage.setItem('foundations', JSON.stringify(window.mockAuth.foundations));

initializeFirebaseBridge();
