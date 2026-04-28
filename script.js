import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// TODO: Replace with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyD7ooC27rCepfxA_KhM4VQOFWhXPpic3hA",
    authDomain: "careconnect-5fcdf.firebaseapp.com",
    projectId: "careconnect-5fcdf",
    storageBucket: "careconnect-5fcdf.firebasestorage.app",
    messagingSenderId: "363752429897",
    appId: "1:363752429897:web:84a8ecf8462470dfa2ef75"
};

// Initialize Firebase
let app, auth, db, googleProvider;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
} catch (error) {
    console.error("Firebase initialization error:", error);
}

// Global State
let currentUser = null;
let currentRole = null; // 'user' or 'ngo'
let hasInitialPublicDataLoaded = false;
let ngoFeedRequestToken = 0;
let urgentNeedsRequestToken = 0;

// DOM Elements
const authModal = document.getElementById('auth-modal');
const closeAuthModal = document.getElementById('close-auth-modal');
const donateModal = document.getElementById('donate-modal');
const closeDonateModal = document.getElementById('close-donate-modal');
const goodsDonateModal = document.getElementById('goods-donate-modal');
const closeGoodsModal = document.getElementById('close-goods-modal');
const navLoginBtn = document.getElementById('nav-login-btn');
const navLogoutBtn = document.getElementById('nav-logout-btn');
const userInfo = document.getElementById('user-info');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const historyBtn = document.getElementById('my-history-btn');
const authForm = document.getElementById('auth-form');
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const signupFields = document.getElementById('signup-fields');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const googleSigninBtn = document.getElementById('google-signin-btn');
const authError = document.getElementById('auth-error');
const roleRadios = document.getElementsByName('role');
const regNameInput = document.getElementById('reg-name');

const foodFeed = document.getElementById('food-feed');
const clothesFeed = document.getElementById('clothes-feed');
const moneyFeed = document.getElementById('money-feed');
const bloodFeed = document.getElementById('blood-feed');
const educationFeed = document.getElementById('education-feed');
const foodEmpty = document.getElementById('food-empty');
const clothesEmpty = document.getElementById('clothes-empty');
const moneyEmpty = document.getElementById('money-empty');
const bloodEmpty = document.getElementById('blood-empty');
const educationEmpty = document.getElementById('education-empty');
const loadSampleBtn = document.getElementById('load-sample-btn');

// Money Donate DOM
const donateForm = document.getElementById('donate-form');
const donateNgoId = document.getElementById('donate-ngo-id');
const donateNgoName = document.getElementById('donate-ngo-name');
const donateType = document.getElementById('donate-type');
const amountGroup = document.getElementById('amount-group');
const donateAmount = document.getElementById('donate-amount');
const donateError = document.getElementById('donate-error');
const donateSuccess = document.getElementById('donate-success');

// Goods Donate DOM
const goodsDonateForm = document.getElementById('goods-donate-form');
const goodsNgoId = document.getElementById('goods-ngo-id');
const goodsNgoName = document.getElementById('goods-ngo-name');
const goodsDonateType = document.getElementById('goods-donate-type');
const goodsError = document.getElementById('goods-error');
const goodsSuccess = document.getElementById('goods-success');

// Connect Modal DOM
const connectModal = document.getElementById('connect-modal');
const closeConnectModal = document.getElementById('close-connect-modal');
const connectNgoIdInput = document.getElementById('connect-ngo-id');
const connectNgoNameInput = document.getElementById('connect-ngo-name');
const connectConfirmBtn = document.getElementById('connect-confirm-btn');
const connectCancelBtn = document.getElementById('connect-cancel-btn');
const connectError = document.getElementById('connect-error');
const connectSuccess = document.getElementById('connect-success');

// NGO Dashboard DOM
const ngoProfileView = document.getElementById('ngo-profile-view');
const needsForm = document.getElementById('needs-form');
const targetAmountGroup = document.getElementById('ngo-target-amount-group');
const dashboardDonationsList = document.getElementById('dashboard-donations-list');
const donationsEmpty = document.getElementById('donations-empty');
const needsSuccess = document.getElementById('needs-success');
const needsError = document.getElementById('needs-error');
const needsCheckboxes = document.querySelectorAll('input[name="ngo-needs"]');
const verifyModal = document.getElementById('verify-modal');
const closeVerifyModal = document.getElementById('close-verify-modal');
const donorHistoryModal = document.getElementById('donor-history-modal');
const closeHistoryModal = document.getElementById('close-donor-history-modal');
const donorHistoryList = document.getElementById('donor-history-list');
const donorHistoryEmpty = document.getElementById('donor-history-empty');
const pastDrivesList = document.getElementById('past-drives-list');
const pastDrivesEmpty = document.getElementById('past-drives-empty');
const jointProgramsList = document.getElementById('joint-programs-list');
const jointProgramsEmpty = document.getElementById('joint-programs-empty');

// Homepage DOM
const urgentNeedsGrid = document.getElementById('urgent-needs-grid');
const categoryFilterGrid = document.getElementById('donation-category-grid');
const ngoListingGrid = document.getElementById('ngo-listing-grid');
const joinNgoBtn = document.getElementById('join-ngo-btn');

function createImageFallback(label = 'CareConnect') {
    const safeLabel = String(label).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600" role="img" aria-label="${safeLabel}">
            <defs>
                <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stop-color="#eef6f1"/>
                    <stop offset="100%" stop-color="#dcefe4"/>
                </linearGradient>
            </defs>
            <rect width="900" height="600" rx="36" fill="url(#g)"/>
            <circle cx="450" cy="250" r="84" fill="#4a9674" fill-opacity="0.15"/>
            <path d="M450 197c-22 0-39 17-39 39 0 34 39 70 39 70s39-36 39-70c0-22-17-39-39-39zm0 55c-9 0-16-7-16-16s7-16 16-16 16 7 16 16-7 16-16 16z" fill="#4a9674"/>
            <text x="450" y="390" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#2d3748">${safeLabel}</text>
            <text x="450" y="435" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#64748b">Image temporarily unavailable</text>
        </svg>
    `.trim();
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function applyImageFallback(img, fallbackLabel) {
    if (!img || img.dataset.fallbackBound === 'true') return;
    img.dataset.fallbackBound = 'true';
    img.loading = img.loading || 'lazy';
    img.decoding = img.decoding || 'async';
    img.addEventListener('error', () => {
        const fallbackSrc = createImageFallback(fallbackLabel || img.alt || 'CareConnect');
        if (img.src !== fallbackSrc) {
            img.src = fallbackSrc;
        }
    });
}

function wireExistingImageFallbacks() {
    document.querySelectorAll('img').forEach((img) => {
        applyImageFallback(img, img.alt);
    });
}

wireExistingImageFallbacks();

function getStoredTheme() {
    const storedTheme = localStorage.getItem('theme');
    return storedTheme === 'dark' ? 'dark' : 'light';
}

function syncThemeToggle(theme) {
    if (!themeToggleBtn) return;

    const isDark = theme === 'dark';
    themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
    themeToggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    themeToggleBtn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
}

function applyTheme(theme) {
    const resolvedTheme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    localStorage.setItem('theme', resolvedTheme);
    syncThemeToggle(resolvedTheme);
}

applyTheme(getStoredTheme());

themeToggleBtn?.addEventListener('click', () => {
    const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
});

function formatDisplayDate(timestamp) {
    if (!timestamp) return 'Unknown date';
    const parsedDate = new Date(timestamp);
    return Number.isNaN(parsedDate.getTime()) ? 'Unknown date' : parsedDate.toLocaleDateString();
}

function formatImpactValue(amount, impactCost) {
    const value = amount / impactCost;
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function openMailClient(email, ngoName) {
    if (!email) {
        alert('This NGO has not shared a contact email yet.');
        return;
    }

    const subject = encodeURIComponent('Collaboration Request via CareConnect');
    const body = encodeURIComponent(`Hello ${ngoName || 'there'},\n\nI would like to connect through CareConnect to explore collaboration opportunities.`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
}

function updateHistoryVisibility(role) {
    if (!historyBtn) return;
    historyBtn.classList.toggle('hidden', role !== 'user');
}

function loadPublicDataOnce(force = false) {
    if (force || !hasInitialPublicDataLoaded) {
        hasInitialPublicDataLoaded = true;
        fetchVerifiedNGOs();
        fetchUrgentNeeds();
    }
}

async function fetchNgoNameById(ngoId) {
    if (!ngoId || !db) return '';

    try {
        const ngoSnap = await getDoc(doc(db, 'ngos', ngoId));
        if (ngoSnap.exists()) {
            return ngoSnap.data().name || '';
        }
    } catch (error) {
        console.error('Failed to resolve NGO name', error);
    }

    return '';
}

async function renderDonorHistory() {
    if (!donorHistoryList || !currentUser || !db) return;

    donorHistoryList.innerHTML = '<p>Loading donation history...</p>';
    donorHistoryEmpty?.classList.add('hidden');

    try {
        const historyQuery = query(collection(db, 'donations'), where('userId', '==', currentUser.uid));
        const historySnapshot = await getDocs(historyQuery);
        const donations = historySnapshot.docs.map((historyDoc) => ({ id: historyDoc.id, ...historyDoc.data() }));

        donations.sort((left, right) => new Date(right.timestamp || 0) - new Date(left.timestamp || 0));

        if (donations.length === 0) {
            donorHistoryList.innerHTML = '';
            donorHistoryEmpty?.classList.remove('hidden');
            return;
        }

        donorHistoryList.innerHTML = '';
        const ngoNameCache = new Map();

        for (const donation of donations) {
            let ngoName = ngoNameCache.get(donation.ngoId);
            if (!ngoName) {
                ngoName = await fetchNgoNameById(donation.ngoId);
                ngoNameCache.set(donation.ngoId, ngoName);
            }

            const historyItem = document.createElement('div');
            historyItem.className = 'donation-item';
            const donationAmount = donation.type === 'Money' ? `₹${Number(donation.amount || 0).toLocaleString()}` : 'Item donation';

            historyItem.innerHTML = `
                <div class="donation-item-header">
                    <span class="donation-type-badge">${donation.type || 'Donation'}</span>
                    <span style="color: var(--text-muted); font-size: 0.85rem;">${formatDisplayDate(donation.timestamp)}</span>
                </div>
                <div style="margin-bottom: 0.35rem;"><strong>Amount:</strong> ${donationAmount}</div>
                <div style="margin-bottom: 0.35rem;"><strong>NGO:</strong> ${ngoName || 'Unknown NGO'}</div>
                <div><strong>Date:</strong> ${formatDisplayDate(donation.timestamp)}</div>
            `;

            donorHistoryList.appendChild(historyItem);
        }
    } catch (error) {
        console.error('Failed to load donor history', error);
        donorHistoryList.innerHTML = '<p>Failed to load donation history.</p>';
    }
}

function openDonorHistoryModal() {
    if (!donorHistoryModal) return;
    donorHistoryModal.classList.remove('hidden');
    renderDonorHistory();
}

function setJoinNgoVisibility(isVisible) {
    if (!joinNgoBtn) return;
    joinNgoBtn.classList.toggle('hidden', !isVisible);
}

// Keep CTA hidden until auth state resolves.
setJoinNgoVisibility(false);

// Modal Toggles
navLoginBtn?.addEventListener('click', () => {
    authModal?.classList.remove('hidden');
    resetAuthForm();
});

closeAuthModal?.addEventListener('click', () => {
    authModal?.classList.add('hidden');
});

closeDonateModal?.addEventListener('click', () => {
    donateModal?.classList.add('hidden');
    donateSuccess?.classList.add('hidden');
    donateError?.classList.add('hidden');
});

closeGoodsModal?.addEventListener('click', () => {
    goodsDonateModal?.classList.add('hidden');
    goodsSuccess?.classList.add('hidden');
    goodsError?.classList.add('hidden');
});

closeVerifyModal?.addEventListener('click', () => {
    verifyModal?.classList.add('hidden');
});

historyBtn?.addEventListener('click', () => {
    if (!currentUser) {
        authModal?.classList.remove('hidden');
        return;
    }

    openDonorHistoryModal();
});

closeHistoryModal?.addEventListener('click', () => {
    donorHistoryModal?.classList.add('hidden');
});

joinNgoBtn?.addEventListener('click', () => {
    authModal?.classList.remove('hidden');
    if (!tabSignup || !tabLogin || !signupFields || !authSubmitBtn) return;

    isLoginMode = false;
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    signupFields.classList.remove('hidden');
    authSubmitBtn.textContent = 'Sign Up';
    resetAuthForm();
});

// Auth Tabs Logic
let isLoginMode = true;

tabLogin?.addEventListener('click', () => {
    isLoginMode = true;
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    signupFields.classList.add('hidden');
    authSubmitBtn.textContent = 'Login';
    resetAuthForm();
});

tabSignup?.addEventListener('click', () => {
    isLoginMode = false;
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    signupFields.classList.remove('hidden');
    authSubmitBtn.textContent = 'Sign Up';
    resetAuthForm();
});

roleRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'ngo') {
            if(regNameInput) regNameInput.placeholder = "Enter NGO Name";
        } else {
            if(regNameInput) regNameInput.placeholder = "Enter Your Name";
        }
    });
});

function resetAuthForm() {
    authForm?.reset();
    authError?.classList.add('hidden');
    if(authError) authError.textContent = '';
}

// Authentication Logic
authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!auth) return alert('Firebase is not configured correctly.');

    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    authError.classList.add('hidden');
    authSubmitBtn.disabled = true;

    try {
        if (isLoginMode) {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            // Sign Up
            const role = document.querySelector('input[name="role"]:checked').value;
            const name = regNameInput.value.trim() || email.split('@')[0];

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store additional user data
            await setDoc(doc(db, "users", user.uid), {
                name: name,
                email: email,
                role: role,
                createdAt: new Date().toISOString()
            });

            // If user signed up as NGO, create an unverified NGO profile entry
            if (role === 'ngo') {
                await setDoc(doc(db, "ngos", user.uid), {
                    name: name,
                    email: email,
                    category: "General",
                    description: "",
                    needs: [],
                    urgency: "",
                    targetAmount: 0,
                    collectedAmount: 0,
                    location: "Unknown",
                    impactPerRupee: "",
                    impactCost: 0,
                    impactUnit: "",
                    verified: false // NGOs start unverified
                });
            }
        }
        authModal.classList.add('hidden');
    } catch (error) {
        authError.textContent = error.message;
        authError.classList.remove('hidden');
    } finally {
        authSubmitBtn.disabled = false;
    }
});

// Google Sign-In Logic
googleSigninBtn?.addEventListener('click', async () => {
    if (!auth) return alert('Firebase is not configured correctly.');
    authError.classList.add('hidden');

    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if user document exists in 'users' collection
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            // New Google user, default to 'user' (donor) role
            await setDoc(userDocRef, {
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                role: 'user', // Defaulting Google sign-in to donor
                createdAt: new Date().toISOString()
            });
        }
        authModal.classList.add('hidden');
    } catch (error) {
        authError.textContent = error.message;
        authError.classList.remove('hidden');
    }
});

navLogoutBtn?.addEventListener('click', () => {
    signOut(auth);
});

function updateNavbarForRole(role) {
    const navLinksContainer = document.querySelector('.nav-links');
    if (!navLinksContainer) return;
    
    const homeLink = navLinksContainer.querySelector('a[href="index.html"]');
    const donateLink = navLinksContainer.querySelector('a[href="donate.html"]');
    let dashboardLink = navLinksContainer.querySelector('a[href="ngo-dashboard.html"]');
    
    if (role === 'ngo') {
        if (homeLink) homeLink.classList.remove('hidden');
        if (donateLink) donateLink.classList.remove('hidden');
        
        if (!dashboardLink) {
            dashboardLink = document.createElement('a');
            dashboardLink.href = 'ngo-dashboard.html';
            dashboardLink.textContent = 'Dashboard';
            if (donateLink && donateLink.nextSibling) {
                navLinksContainer.insertBefore(dashboardLink, donateLink.nextSibling);
            } else {
                navLinksContainer.appendChild(dashboardLink);
            }
        } else {
            dashboardLink.classList.remove('hidden');
        }
        updateHistoryVisibility(role);
    } else {
        if (homeLink) homeLink.classList.remove('hidden');
        if (donateLink) donateLink.classList.remove('hidden');
        if (dashboardLink && !window.location.pathname.includes('ngo-dashboard.html')) {
            dashboardLink.classList.add('hidden');
        }
        updateHistoryVisibility(role);
    }
}

// Update donate page for NGO role - change labels to "Connect"
function updateDonatePageForNGO(isNGO) {
    const feedTitle = document.getElementById('feed-title');
    const feedSubtitle = document.getElementById('feed-subtitle');
    const donationNav = document.getElementById('donation-nav');
    
    // Update header
    if (feedTitle) {
        feedTitle.textContent = isNGO ? 'Connect with NGOs' : 'Donation Centers & NGOs';
    }
    if (feedSubtitle) {
        feedSubtitle.textContent = isNGO ? 'Find verified organizations to connect and collaborate with.' : 'Find verified organizations based on what you want to donate.';
    }
    
    // Update section titles
    const sectionTitles = {
        'food-title': { ngo: 'Food Connections', user: 'Food Donations' },
        'clothes-title': { ngo: 'Clothes Connections', user: 'Clothes Donations' },
        'blood-title': { ngo: 'Blood Donation Camps', user: 'Blood Donation Camps' },
        'money-title': { ngo: 'Money Connections', user: 'Money Donations' },
        'education-title': { ngo: 'Education Connections', user: 'Education Donations (Books/Stationary)' }
    };
    
    for (const [id, texts] of Object.entries(sectionTitles)) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = isNGO ? texts.ngo : texts.user;
        }
    }
    
    // Update all rendered NGO card buttons
    document.querySelectorAll('.donate-btn').forEach(btn => {
        const type = btn.dataset.type || '';
        btn.textContent = isNGO ? 'Connect' : `Donate ${type}`;
    });
    
    // Update "Needs" label to "Causes" for NGO
    document.querySelectorAll('.ngo-needs strong').forEach(label => {
        label.textContent = isNGO ? 'Causes:' : 'Needs:';
    });
}

// Auth State Observer
// Pre-load from localStorage to prevent navbar flicker
const storedUser = localStorage.getItem('careConnectUser');
if (storedUser) {
    try {
        const { name, email, role } = JSON.parse(storedUser);
        if (userInfo) {
            userInfo.classList.remove('hidden');
            userInfo.textContent = name ? `Hello, ${name} (${role})` : `Hello, ${email}`;
        }
        navLoginBtn?.classList.add('hidden');
        navLogoutBtn?.classList.remove('hidden');
        updateNavbarForRole(role);
        updateDonatePageForNGO(role === 'ngo');
    } catch(e) {}
}

if (auth) {
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (user) {
            setJoinNgoVisibility(false);
            navLoginBtn?.classList.add('hidden');
            navLogoutBtn?.classList.remove('hidden');
            userInfo?.classList.remove('hidden');

            // Fetch user role
            try {
                const docSnap = await getDoc(doc(db, "users", user.uid));
                if (docSnap.exists() && userInfo) {
                    currentRole = docSnap.data().role;
                    const userName = docSnap.data().name;
                    userInfo.textContent = `Hello, ${userName} (${currentRole})`;
                    localStorage.setItem('careConnectUser', JSON.stringify({ name: userName, email: user.email, role: currentRole }));
                } else if(userInfo) {
                    currentRole = 'user';
                    userInfo.textContent = `Hello, ${user.email}`;
                    localStorage.setItem('careConnectUser', JSON.stringify({ name: '', email: user.email, role: currentRole }));
                }

                updateNavbarForRole(currentRole);
                updateDonatePageForNGO(currentRole === 'ngo');
                loadPublicDataOnce();

                // Route Protection
                const currentPath = window.location.pathname;
                const isDashboard = currentPath.includes('ngo-dashboard.html');
                const isIndex = currentPath.includes('index.html') || currentPath.endsWith('/') || currentPath.endsWith('CareConnect\\') || currentPath.endsWith('CareConnect');
                const isDonate = currentPath.includes('donate.html');

                if (currentRole === 'user' && isDashboard) {
                    window.location.href = 'index.html';
                    return;
                }

                if (currentRole === 'ngo' && isDashboard) {
                    initNGODashboard();
                }

            } catch (e) {
                console.error("Error fetching user data", e);
            }
        } else {
            localStorage.removeItem('careConnectUser');
            setJoinNgoVisibility(true);
            navLoginBtn?.classList.remove('hidden');
            navLogoutBtn?.classList.add('hidden');
            userInfo?.classList.add('hidden');
            if(userInfo) userInfo.textContent = '';
            currentRole = null;
            updateNavbarForRole(null);
            updateDonatePageForNGO(false);
            loadPublicDataOnce();

            const currentPath = window.location.pathname;
            if (currentPath.includes('ngo-dashboard.html')) {
                window.location.href = 'index.html';
            }
        }
    });
}

// Fetch NGOs (Only runs if we have donation feeds present)
async function fetchVerifiedNGOs() {
    if (!foodFeed && !clothesFeed && !moneyFeed && !bloodFeed && !educationFeed) return;
    const requestToken = ++ngoFeedRequestToken;
    
    if (!db) {
        if(foodFeed) foodFeed.innerHTML = "<p style='text-align:center;color:red'>Firebase not configured. Please add config.</p>";
        return;
    }
    
    if(foodFeed) foodFeed.innerHTML = "<p>Loading...</p>";
    if(clothesFeed) clothesFeed.innerHTML = "<p>Loading...</p>";
    if(moneyFeed) moneyFeed.innerHTML = "<p>Loading...</p>";
    if(bloodFeed) bloodFeed.innerHTML = "<p>Loading...</p>";
    if(educationFeed) educationFeed.innerHTML = "<p>Loading...</p>";

    foodEmpty?.classList.add('hidden');
    clothesEmpty?.classList.add('hidden');
    moneyEmpty?.classList.add('hidden');
    bloodEmpty?.classList.add('hidden');
    educationEmpty?.classList.add('hidden');

    try {
        const q = query(collection(db, "ngos"), where("verified", "==", true));
        const querySnapshot = await getDocs(q);
        if (requestToken !== ngoFeedRequestToken) return;

        if(foodFeed) foodFeed.innerHTML = "";
        if(clothesFeed) clothesFeed.innerHTML = "";
        if(moneyFeed) moneyFeed.innerHTML = "";
        if(bloodFeed) bloodFeed.innerHTML = "";
        if(educationFeed) educationFeed.innerHTML = "";

        let foodCount = 0, clothesCount = 0, moneyCount = 0, bloodCount = 0, educationCount = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const needs = data.needs || [];
            
            if (needs.includes("Food") && foodFeed) {
                renderNgoCard(doc.id, data, "Food", foodFeed);
                foodCount++;
            }
            if (needs.includes("Clothes") && clothesFeed) {
                renderNgoCard(doc.id, data, "Clothes", clothesFeed);
                clothesCount++;
            }
            if (needs.includes("Money") && moneyFeed) {
                renderNgoCard(doc.id, data, "Money", moneyFeed);
                moneyCount++;
            }
            if (needs.includes("Blood") && bloodFeed) {
                renderNgoCard(doc.id, data, "Blood", bloodFeed);
                bloodCount++;
            }
            if (needs.includes("Education") && educationFeed) {
                renderNgoCard(doc.id, data, "Education", educationFeed);
                educationCount++;
            }
        });

        if (foodCount === 0 && foodEmpty) foodEmpty.classList.remove('hidden');
        if (clothesCount === 0 && clothesEmpty) clothesEmpty.classList.remove('hidden');
        if (moneyCount === 0 && moneyEmpty) moneyEmpty.classList.remove('hidden');
        if (bloodCount === 0 && bloodEmpty) bloodEmpty.classList.remove('hidden');
        if (educationCount === 0 && educationEmpty) educationEmpty.classList.remove('hidden');

    } catch (error) {
        console.error("Error fetching NGOs:", error);
    }
}

function renderNgoCard(id, data, type, container) {
    const card = document.createElement('div');
    card.className = 'ngo-card';

    // Calculate progress for money
    let progressPercentage = 0;
    let showProgress = false;
    if (data.targetAmount && data.targetAmount > 0) {
        showProgress = true;
        progressPercentage = Math.min(100, Math.round((data.collectedAmount / data.targetAmount) * 100));
    }

    const needsHtml = data.needs ? data.needs.map(need => `<span>${need}</span>`).join('') : '';
    const locationText = data.location ? `<p class="ngo-location">${data.location}</p>` : '';
    
    // Always show contact info
    const contactEmail = data.email || 'Not provided';
    const contactPhone = data.phone || 'Not provided';
    const campTimeHtml = (type === 'Blood' || data.category === 'Blood') ? 
        `<div style="margin-bottom: 0.15rem;">🕒 <strong>Time:</strong> ${data.campTime || 'Contact for available times'}</div>` : '';

    const contactInfoHtml = `
        <div style="margin: 0.75rem 0; font-size: 0.85rem; padding: 0.75rem; background: var(--surface-muted); border-radius: var(--radius-sm); border: 1px solid var(--border-strong);">
            <div style="color: var(--primary-strong); font-weight: bold; margin-bottom: 0.25rem;">Contact Details:</div>
            ${campTimeHtml}
            <div style="margin-bottom: 0.15rem;">📧 <strong>Email:</strong> ${contactEmail}</div>
            <div>📞 <strong>Phone:</strong> ${contactPhone}</div>
        </div>
    `;

    const progressHtml = showProgress ? `
        <div class="progress-container">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercentage}%"></div>
            </div>
            <div class="progress-stats">
                <span>₹${data.collectedAmount || 0} raised</span>
                <span>Goal: ₹${data.targetAmount || 0}</span>
            </div>
        </div>
    ` : '';

    card.innerHTML = `
        <div class="ngo-content">
            <div class="ngo-header">
                <h3 class="ngo-name">${data.name}</h3>
                <div style="display:flex; gap:0.5rem;">
                    <span class="ngo-badge badge-urgency badge-${(data.urgency || 'Low').toLowerCase()}">${data.urgency || 'Low'}</span>
                    <span class="ngo-badge badge-verified">✓ Verified</span>
                </div>
            </div>
            <span class="ngo-category">${data.category}</span>
            ${locationText}
            <p class="ngo-desc">${data.description}</p>
            ${contactInfoHtml}
            
            <div class="ngo-needs">
                <strong>${currentRole === 'ngo' ? 'Causes:' : 'Needs:'}</strong>
                <div>${needsHtml}</div>
            </div>

            ${progressHtml}
            
                <button class="btn btn-outline full-width donate-btn" data-id="${id}" data-name="${data.name}" data-type="${type}">${currentRole === 'ngo' ? 'Connect' : `Donate ${type}`}</button>
        </div>
    `;

    container.appendChild(card);

    // Add event listener to the newly created button
    card.querySelector('.donate-btn').addEventListener('click', (e) => {
        if (currentRole === 'ngo') {
            // Open connection confirmation modal
            openConnectModal(id, data.name);
            return;
        }

        if (!currentUser) {
            alert("Please log in to donate.");
            authModal?.classList.remove('hidden');
            return;
        }

        if (type === 'Food' || type === 'Clothes' || type === 'Education' || type === 'Blood') {
            openGoodsModal(id, data.name, type);
        } else {
            openDonateModal(id, data.name);
        }
    });
}

// Money Donation Modal Logic
function openDonateModal(ngoId, ngoName) {
    if(!donateModal) return;
    donateNgoId.value = ngoId;
    donateNgoName.textContent = `Donate to ${ngoName}`;
    donateNgoName.dataset.ngoName = ngoName;
    donateType.value = 'Money';
    amountGroup?.classList.remove('hidden');
    donateAmount.required = true;
    donateForm.reset();
    donateError.classList.add('hidden');
    donateSuccess.classList.add('hidden');
    donateModal.classList.remove('hidden');
}

donateForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser || !db) return;

    donateError.classList.add('hidden');
    donateSuccess.classList.add('hidden');
    const submitBtn = document.getElementById('donate-submit-btn');
    submitBtn.disabled = true;

    const type = donateType.value || 'Money';
    const amount = Number(donateAmount.value);
    const ngoId = donateNgoId.value;
    const ngoName = donateNgoName.dataset.ngoName || donateNgoName.textContent.replace(/^Donate to\s*/i, '') || 'this NGO';

    if (!Number.isFinite(amount) || amount <= 0) {
        donateError.textContent = 'Please enter a valid donation amount.';
        donateError.classList.remove('hidden');
        submitBtn.disabled = false;
        return;
    }

    try {
        const ngoRef = doc(db, "ngos", ngoId);
        const ngoSnap = await getDoc(ngoRef);
        const ngoData = ngoSnap.exists() ? ngoSnap.data() : {};
        const impactCost = Number(ngoData.impactCost);
        const impactUnit = String(ngoData.impactUnit || '').trim();
        const hasImpactData = Number.isFinite(impactCost) && impactCost > 0 && impactUnit;
        const impactEstimate = hasImpactData ? formatImpactValue(amount, impactCost) : '';

        // 1. Create donation document
        await addDoc(collection(db, "donations"), {
            ngoId: ngoId,
            ngoName: ngoName,
            userId: currentUser.uid,
            type: type,
            amount: amount,
            impactCost: hasImpactData ? impactCost : null,
            impactUnit: hasImpactData ? impactUnit : '',
            impactEstimate: hasImpactData ? impactEstimate : '',
            timestamp: new Date().toISOString()
        });

        // 2. If it's a money donation, update the NGO's collectedAmount
        if (amount > 0) {
            if (ngoSnap.exists()) {
                const currentAmount = ngoSnap.data().collectedAmount || 0;
                await updateDoc(ngoRef, {
                    collectedAmount: currentAmount + amount
                });
            }
        }

        const impactMessage = hasImpactData ? ` Your ₹${amount.toLocaleString()} donation will provide ${impactEstimate} ${impactUnit}!` : '';
        donateSuccess.textContent = `Thank you for your donation!${impactMessage}`;
        donateSuccess.classList.remove('hidden');
        donateForm.reset();

        // Refresh feed after a short delay
        setTimeout(() => {
            donateModal.classList.add('hidden');
            fetchVerifiedNGOs();
        }, 2000);

    } catch (error) {
        console.error("Donation error", error);
        donateError.textContent = "Failed to process donation. Try again.";
        donateError.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
    }
});

// Goods Donation Modal Logic
function openGoodsModal(ngoId, ngoName, type) {
    if(!goodsDonateModal) return;
    goodsNgoId.value = ngoId;
    goodsNgoName.textContent = `Donate ${type} to ${ngoName}`;
    goodsDonateType.value = type;
    
    const goodsDescGroup = document.getElementById('goods-desc-group');
    const goodsDescInput = document.getElementById('goods-desc');
    const goodsAddressGroup = document.getElementById('goods-address-group');
    const goodsAddressInput = document.getElementById('goods-address');

    if (goodsDescGroup && goodsDescInput && goodsAddressGroup && goodsAddressInput) {
        if (type === 'Blood') {
            goodsDescGroup.classList.add('hidden');
            goodsDescInput.required = false;
            goodsAddressGroup.classList.add('hidden');
            goodsAddressInput.required = false;
        } else {
            goodsDescGroup.classList.remove('hidden');
            goodsDescInput.required = true;
            goodsAddressGroup.classList.remove('hidden');
            goodsAddressInput.required = true;
        }
    }

    goodsDonateForm.reset();
    goodsError.classList.add('hidden');
    goodsSuccess.classList.add('hidden');
    goodsDonateModal.classList.remove('hidden');
}

goodsDonateForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser || !db) return;

    goodsError.classList.add('hidden');
    goodsSuccess.classList.add('hidden');
    const submitBtn = document.getElementById('goods-submit-btn');
    submitBtn.disabled = true;

    const type = goodsDonateType.value;
    const ngoId = goodsNgoId.value;
    const name = document.getElementById('goods-name').value;
    const contact = document.getElementById('goods-contact').value;
    const address = document.getElementById('goods-address').value;
    const desc = document.getElementById('goods-desc').value;

    try {
        await addDoc(collection(db, "donations"), {
            ngoId: ngoId,
            userId: currentUser.uid,
            type: type,
            donorName: name,
            contact: contact,
            address: address,
            description: desc,
            timestamp: new Date().toISOString()
        });
        goodsSuccess.classList.remove('hidden');
        goodsDonateForm.reset();
        
        setTimeout(() => {
            goodsDonateModal.classList.add('hidden');
        }, 3000);

    } catch (error) {
        console.error("Donation error", error);
        goodsError.textContent = "Failed to process donation. Try again.";
        goodsError.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
    }
});

// Connect Modal Functions for NGO-to-NGO connections
function openConnectModal(ngoId, ngoName) {
    if (!connectModal) return;
    connectNgoIdInput.value = ngoId;
    connectNgoNameInput.value = ngoName;
    document.getElementById('connect-confirm-text').textContent = 
        `Are you sure you want to connect with "${ngoName}" to collaborate on the same cause?`;
    connectError.classList.add('hidden');
    connectSuccess.classList.add('hidden');
    connectModal.classList.remove('hidden');
}

function closeConnectModalFunc() {
    if (connectModal) {
        connectModal.classList.add('hidden');
    }
}

// Connect modal event listeners
closeConnectModal?.addEventListener('click', closeConnectModalFunc);
connectCancelBtn?.addEventListener('click', closeConnectModalFunc);

connectConfirmBtn?.addEventListener('click', async () => {
    if (!currentUser || !db) {
        alert("Please log in first.");
        return;
    }

    const targetNgoId = connectNgoIdInput.value;
    const targetNgoName = connectNgoNameInput.value;
    const currentNgoId = currentUser.uid;

    if (!targetNgoId || !targetNgoName) {
        alert("Invalid NGO selection.");
        return;
    }

    // Prevent connecting to self
    if (targetNgoId === currentNgoId) {
        alert("You cannot connect with yourself.");
        return;
    }

    connectError.classList.add('hidden');
    connectSuccess.classList.add('hidden');
    connectConfirmBtn.disabled = true;

    try {
        // Check if connection already exists
        const existingConnection = await getDocs(query(
            collection(db, "ngo_connections"),
            where("fromNgoId", "==", currentNgoId),
            where("toNgoId", "==", targetNgoId)
        ));

        if (!existingConnection.empty) {
            alert("You have already sent a connection request to this NGO.");
            connectConfirmBtn.disabled = false;
            return;
        }

        // Create connection request
        await addDoc(collection(db, "ngo_connections"), {
            fromNgoId: currentNgoId,
            fromNgoName: currentRole === 'ngo' ? (currentUser.displayName || currentUser.email) : 'Unknown',
            toNgoId: targetNgoId,
            toNgoName: targetNgoName,
            status: 'pending',
            timestamp: new Date().toISOString()
        });

        connectSuccess.classList.remove('hidden');
        connectConfirmBtn.disabled = true;
        connectConfirmBtn.textContent = "Connected!";

        // Close modal after delay
        setTimeout(() => {
            closeConnectModalFunc();
        }, 2000);

    } catch (error) {
        console.error("Connection error:", error);
        connectError.textContent = "Failed to send connection request. Please try again.";
        connectError.classList.remove('hidden');
    } finally {
        connectConfirmBtn.disabled = false;
    }
});

// Close connect modal when clicking outside
connectModal?.addEventListener('click', (e) => {
    if (e.target === connectModal) {
        closeConnectModalFunc();
    }
});


// Load Sample NGOs Functionality
loadSampleBtn?.addEventListener('click', async () => {
    if (!db) return alert('Firebase is not configured.');
    loadSampleBtn.disabled = true;
    loadSampleBtn.textContent = 'Loading...';

    const sampleNGOs = [
        {
            name: "Food For All Foundation",
            category: "Food",
            description: "We provide nutritious meals to underprivileged children across the country.",
            needs: ["Food", "Money"],
            urgency: "High",
            targetAmount: 50000,
            collectedAmount: 12500,
            location: "Mumbai",
            impactPerRupee: "₹50 = 1 Meal",
            impactCost: 50,
            impactUnit: "Meals",
            verified: true,
            email: "hello@foodforall.org"
        },
        {
            name: "Warm Hearts Winter Drive",
            category: "Clothes",
            description: "Collecting warm clothes and blankets for the homeless during harsh winters.",
            needs: ["Clothes", "Money"],
            urgency: "High",
            targetAmount: 20000,
            collectedAmount: 18000,
            location: "Delhi",
            impactPerRupee: "₹200 = 1 Blanket",
            impactCost: 200,
            impactUnit: "Blankets",
            verified: true,
            email: "connect@warmhearts.org"
        },
        {
            name: "LifeBlood Initiative",
            category: "Blood",
            description: "Connecting blood donors with patients in urgent need during medical emergencies.",
            needs: ["Blood"],
            urgency: "Critical",
            targetAmount: 0,
            collectedAmount: 0,
            location: "Bangalore",
            impactPerRupee: "N/A",
            verified: true,
            email: "care@lifeblood.org"
        },
        {
            name: "Future Scholars Org",
            category: "Education",
            description: "Providing school supplies and scholarships to promising students from low-income families.",
            needs: ["Money", "Education"],
            urgency: "Medium",
            targetAmount: 100000,
            collectedAmount: 45000,
            location: "Chennai",
            impactPerRupee: "₹500 = Books for a month",
            impactCost: 500,
            impactUnit: "Months of books",
            verified: true,
            email: "partnerships@futurescholars.org"
        },
        {
            name: "Unverified Sketchy NGO",
            category: "Medical",
            description: "We need money for things.",
            needs: ["Money"],
            urgency: "Low",
            targetAmount: 1000000,
            collectedAmount: 0,
            location: "Unknown",
            impactPerRupee: "Unknown",
            verified: false, // THIS SHOULD NOT APPEAR IN THE FEED
            email: "unknown@example.com"
        }
    ];

    try {
        for (const ngo of sampleNGOs) {
            await addDoc(collection(db, "ngos"), ngo);
        }
        alert("Sample NGOs loaded successfully!");
        fetchVerifiedNGOs();
    } catch (error) {
        console.error("Error loading samples:", error);
        alert("Error loading sample data. Check console.");
    } finally {
        loadSampleBtn.disabled = false;
        loadSampleBtn.textContent = 'Load Sample NGOs';
    }
});

// Needs Checkbox -> Target Amount logic
needsCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
        const hasMoney = Array.from(needsCheckboxes).some(c => c.checked && c.value === 'Money');
        if (hasMoney) {
            targetAmountGroup?.classList.remove('hidden');
            document.getElementById('ngo-target-amount').required = true;
        } else {
            targetAmountGroup?.classList.add('hidden');
            document.getElementById('ngo-target-amount').required = false;
            document.getElementById('ngo-target-amount').value = '';
        }
    });
});

async function initNGODashboard() {
    if (!currentUser) return;

    try {
        // Fetch Profile
        const ngoSnap = await getDoc(doc(db, "ngos", currentUser.uid));
        if (ngoSnap.exists() && ngoProfileView) {
            const data = ngoSnap.data();
            let verificationWarning = '';
            if (!data.verified) {
                verificationWarning = `
                    <div style="background: #fff8eb; color: #b7791f; padding: 1.25rem; border-radius: 8px; margin-top: 1.5rem; border: 1px solid #fbd38d;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap: 1rem; flex-wrap: wrap;">
                            <div>
                                <strong style="font-size: 1.05rem; display:block; margin-bottom:0.25rem;">⚠️ Profile Under Review</strong>
                                <span style="font-size: 0.9rem;">Your NGO is unverified and hidden from donation feeds.</span>
                            </div>
                            <button id="btn-get-verified" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size:0.9rem;">Get Verified</button>
                        </div>
                    </div>
                `;
            }

            let financialStats = `
                <div style="margin-bottom: 0.5rem;"><strong>Collected Amount:</strong> ₹${data.collectedAmount || 0}</div>
            `;

            if (data.needs && data.needs.includes('Money')) {
                const target = data.targetAmount || 0;
                const collected = data.collectedAmount || 0;
                const remaining = Math.max(0, target - collected);
                financialStats = `
                    <div style="margin-bottom: 0.5rem;"><strong>Target Amount:</strong> ₹${target}</div>
                    <div style="margin-bottom: 0.5rem;"><strong>Collected Amount:</strong> ₹${collected}</div>
                    <div style="margin-bottom: 0.5rem;"><strong>Remaining Amount:</strong> ₹${remaining}</div>
                `;
            }

            let stopDonationBtn = '';
            if (data.needs && data.needs.length > 0) {
                stopDonationBtn = `
                    <button id="stop-donation-btn" class="btn btn-outline" style="margin-top: 1rem; color: var(--error); border-color: var(--error); padding: 0.5rem 1rem; font-size: 0.9rem;">Stop Current Donation Drive</button>
                `;
            }

            ngoProfileView.innerHTML = `
                <div style="margin-bottom: 0.5rem;"><strong>Name:</strong> ${data.name}</div>
                <div style="margin-bottom: 0.5rem;"><strong>Category:</strong> ${data.category}</div>
                <div style="margin-bottom: 0.5rem;"><strong>Status:</strong> ${data.verified ? '<span style="color:var(--success);">✓ Verified</span>' : '<span style="color:var(--error);">Pending Verification</span>'}</div>
                <div style="margin-bottom: 0.5rem;"><strong>Current Needs:</strong> ${data.needs && data.needs.length ? data.needs.join(', ') : 'None'}</div>
                ${data.needs && data.needs.length && data.urgency ? `<div style="margin-bottom: 0.5rem;"><strong>Assigned Urgency:</strong> <span class="ngo-badge badge-urgency badge-${data.urgency.toLowerCase()}" style="display:inline-block; margin-left: 0.5rem;">${data.urgency}</span></div>` : ''}
                ${financialStats}
                ${stopDonationBtn}
                ${verificationWarning}
            `;

            const getVerifiedBtn = document.getElementById('btn-get-verified');
            if (getVerifiedBtn && verifyModal) {
                getVerifiedBtn.addEventListener('click', () => {
                    verifyModal.classList.remove('hidden');
                });
            }

            const stopBtn = document.getElementById('stop-donation-btn');
            if (stopBtn) {
                stopBtn.addEventListener('click', async () => {
                    if (confirm("Are you sure you want to stop the current donation drive? This will clear your current needs.")) {
                        stopBtn.disabled = true;
                        try {
                            await addDoc(collection(db, 'pastDrives'), {
                                ngoId: currentUser.uid,
                                ngoName: data.name || '',
                                needs: data.needs || [],
                                collectedAmount: data.collectedAmount || 0,
                                targetAmount: data.targetAmount || 0,
                                urgency: data.urgency || '',
                                description: data.description || '',
                                timestamp: new Date().toISOString()
                            });

                            await updateDoc(doc(db, "ngos", currentUser.uid), {
                                needs: [],
                                targetAmount: 0,
                                collectedAmount: 0,
                                impactCost: 0,
                                impactUnit: ""
                            });
                            alert("Donation drive stopped. Your needs have been cleared.");
                            initNGODashboard();
                        } catch (error) {
                            console.error("Error stopping drive", error);
                            alert("Failed to stop donation drive.");
                            stopBtn.disabled = false;
                        }
                    }
                });
            }

            // Populate Needs Form
            if (needsForm) {
                const needs = data.needs || [];
                needsCheckboxes.forEach(cb => {
                    cb.checked = needs.includes(cb.value);
                });
                const descInput = document.getElementById('ngo-description');
                if (descInput) {
                    descInput.value = data.description === 'A new NGO on the platform.' ? '' : (data.description || '');
                }
                
                const targetAmtInput = document.getElementById('ngo-target-amount');
                if (needs.includes('Money')) {
                    targetAmountGroup?.classList.remove('hidden');
                    if (targetAmtInput) {
                        targetAmtInput.required = true;
                        targetAmtInput.value = data.targetAmount || '';
                    }
                } else {
                    targetAmountGroup?.classList.add('hidden');
                }
            }
        }

        // Fetch Donations
        if (dashboardDonationsList) {
            const q = query(collection(db, "donations"), where("ngoId", "==", currentUser.uid));
            const querySnapshot = await getDocs(q);

            dashboardDonationsList.innerHTML = '';
            if (querySnapshot.empty) {
                donationsEmpty?.classList.remove('hidden');
            } else {
                donationsEmpty?.classList.add('hidden');
                
                // Sort client-side by timestamp descending
                const donations = [];
                querySnapshot.forEach(doc => donations.push({id: doc.id, ...doc.data()}));
                donations.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

                donations.forEach(data => {
                    const d = document.createElement('div');
                    d.className = 'donation-item';
                    const date = new Date(data.timestamp).toLocaleDateString();
                    
                    let details = '';
                    if (data.type === 'Money') {
                        details = `<div style="font-weight: 600; font-size: 1.1rem; color: var(--primary-dark);">₹${data.amount}</div>`;
                    } else {
                        details = `
                            <div style="margin-bottom: 0.2rem;"><strong>Donor:</strong> ${data.donorName} (${data.contact})</div>
                            <div style="margin-bottom: 0.2rem;"><strong>Address:</strong> ${data.address}</div>
                            <div><strong>Details:</strong> ${data.description}</div>
                        `;
                    }

                    d.innerHTML = `
                        <div class="donation-item-header">
                            <span class="donation-type-badge">${data.type}</span>
                            <span style="color: var(--text-muted); font-size: 0.85rem;">${date}</span>
                        </div>
                        ${details}
                    `;
                    dashboardDonationsList.appendChild(d);
                });
            }
        }

        if (pastDrivesList) {
            const pastQuery = query(collection(db, 'pastDrives'), where('ngoId', '==', currentUser.uid));
            const pastSnapshot = await getDocs(pastQuery);
            const pastDrives = pastSnapshot.docs.map((pastDoc) => ({ id: pastDoc.id, ...pastDoc.data() }));
            pastDrives.sort((left, right) => new Date(right.timestamp || 0) - new Date(left.timestamp || 0));

            pastDrivesList.innerHTML = '';
            if (pastDrives.length === 0) {
                pastDrivesEmpty?.classList.remove('hidden');
            } else {
                pastDrivesEmpty?.classList.add('hidden');
                pastDrives.forEach((drive) => {
                    const driveItem = document.createElement('div');
                    driveItem.className = 'donation-item past-drive-item';
                    driveItem.innerHTML = `
                        <div class="donation-item-header">
                            <span class="donation-type-badge">Past Drive</span>
                            <span style="color: var(--text-muted); font-size: 0.85rem;">${formatDisplayDate(drive.timestamp)}</span>
                        </div>
                        <div style="margin-bottom: 0.35rem;"><strong>Needs:</strong> ${(drive.needs || []).join(', ') || 'None'}</div>
                        <div style="margin-bottom: 0.35rem;"><strong>Collected:</strong> ₹${Number(drive.collectedAmount || 0).toLocaleString()}</div>
                        <div style="margin-bottom: 0.35rem;"><strong>Target:</strong> ₹${Number(drive.targetAmount || 0).toLocaleString()}</div>
                        <div><strong>Summary:</strong> ${drive.description || 'No description provided.'}</div>
                    `;
                    pastDrivesList.appendChild(driveItem);
                });
            }
        }

        // Fetch Joint Programs (Connected NGOs)
        if (jointProgramsList) {
            try {
                // Get connections where current NGO is the sender
                const sentQuery = query(
                    collection(db, "ngo_connections"),
                    where("fromNgoId", "==", currentUser.uid)
                );
                const sentSnapshot = await getDocs(sentQuery);
                
                // Get connections where current NGO is the receiver
                const receivedQuery = query(
                    collection(db, "ngo_connections"),
                    where("toNgoId", "==", currentUser.uid)
                );
                const receivedSnapshot = await getDocs(receivedQuery);

                const connections = [];
                
                sentSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.status === 'pending' || data.status === 'accepted') {
                        connections.push({
                            id: doc.id,
                            ngoName: data.toNgoName,
                            ngoId: data.toNgoId,
                            status: data.status,
                            timestamp: data.timestamp,
                            direction: 'sent'
                        });
                    }
                });

                receivedSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.status === 'pending' || data.status === 'accepted') {
                        connections.push({
                            id: doc.id,
                            ngoName: data.fromNgoName,
                            ngoId: data.fromNgoId,
                            status: data.status,
                            timestamp: data.timestamp,
                            direction: 'received'
                        });
                    }
                });

                // Sort by timestamp
                connections.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                jointProgramsList.innerHTML = '';
                if (connections.length === 0) {
                    jointProgramsEmpty?.classList.remove('hidden');
                } else {
                    jointProgramsEmpty?.classList.add('hidden');
                    connections.forEach(conn => {
                        const connItem = document.createElement('div');
                        connItem.className = 'donation-item';
                        const statusBadge = conn.status === 'accepted' ? 
                            '<span class="ngo-badge badge-verified" style="background: var(--success);">Active</span>' :
                            '<span class="ngo-badge badge-urgency badge-medium">Pending</span>';
                        
                        connItem.innerHTML = `
                            <div class="donation-item-header">
                                <span class="donation-type-badge">Connected NGO</span>
                                ${statusBadge}
                            </div>
                            <div style="margin-bottom: 0.35rem;"><strong>NGO Name:</strong> ${conn.ngoName}</div>
                            <div style="margin-bottom: 0.35rem;"><strong>Connected On:</strong> ${formatDisplayDate(conn.timestamp)}</div>
                            <div><strong>Status:</strong> ${conn.status === 'accepted' ? 'Collaboration Active' : 'Awaiting Response'}</div>
                        `;
                        jointProgramsList.appendChild(connItem);
                    });
                }
            } catch (e) {
                console.error("Error fetching joint programs:", e);
                jointProgramsList.innerHTML = '<p>Failed to load connections.</p>';
            }
        }

    } catch (e) {
        console.error("Dashboard init error", e);
    }
}

// Needs Form Submit
needsForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser || currentRole !== 'ngo') return;

    needsSuccess?.classList.add('hidden');
    needsError?.classList.add('hidden');
    const submitBtn = document.getElementById('needs-submit-btn');
    if(submitBtn) submitBtn.disabled = true;

    const originalBtnText = submitBtn ? submitBtn.textContent : '';
    if(submitBtn) submitBtn.textContent = 'Analyzing Urgency...';

    const selectedNeeds = Array.from(needsCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
    
    const descriptionEl = document.getElementById('ngo-description');
    const description = descriptionEl ? descriptionEl.value : '';

    let urgency = 'Medium';
    if (description) {
        try {
            const response = await fetch('http://localhost:3000/api/classify-urgency', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description })
            });
            if (response.ok) {
                const data = await response.json();
                urgency = data.urgency || 'Medium';
            }
        } catch (err) {
            console.error("AI classification failed, falling back to Medium:", err);
        }
    }

    let targetAmount = 0;
    if (selectedNeeds.includes('Money')) {
        targetAmount = Number(document.getElementById('ngo-target-amount').value);
    }

    try {
        await updateDoc(doc(db, "ngos", currentUser.uid), {
            needs: selectedNeeds,
            urgency: urgency,
            description: description,
            targetAmount: targetAmount
        });
        
        if(needsSuccess) {
            needsSuccess.classList.remove('hidden');
            setTimeout(() => { needsSuccess.classList.add('hidden'); }, 3000);
        }
        
        // Refresh profile view
        initNGODashboard();
    } catch (error) {
        console.error("Error updating needs", error);
        if(needsError) needsError.classList.remove('hidden');
    } finally {
        if(submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText || 'Save Changes';
        }
    }
});

// Fetch Urgent Needs for Homepage
async function fetchUrgentNeeds() {
    if (!urgentNeedsGrid) return;
    const requestToken = ++urgentNeedsRequestToken;
    
    if (!db) {
        urgentNeedsGrid.innerHTML = "<p>Firebase not configured.</p>";
        return;
    }

    try {
        const q = query(collection(db, "ngos"), where("verified", "==", true));
        const querySnapshot = await getDocs(q);
        if (requestToken !== urgentNeedsRequestToken) return;
        
        const needMeta = {
            Food: {
                image: 'https://images.unsplash.com/photo-1593113565694-c6f1c422c54c?w=400&q=80',
                title: 'Food Needed'
            },
            Blood: {
                image: 'https://images.unsplash.com/photo-1536856136534-bb679c52a9aa?w=400&q=80',
                title: 'Blood Needed'
            },
            Clothes: {
                image: 'https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?w=400&q=80',
                title: 'Clothes Needed'
            },
            Money: {
                image: 'https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=400&q=80',
                title: 'Funds Needed'
            }
        };

        const needPriority = ['Food', 'Blood', 'Clothes', 'Money'];
        const urgencyRank = {
            Critical: 3,
            High: 2,
            Medium: 1,
            Low: 0
        };
        const ngoNeedsMap = new Map();

        querySnapshot.forEach(doc => {
            const data = doc.data();
            const needs = Array.isArray(data.needs) ? data.needs : [];
            if (needs.length > 0) {
                const primaryNeed = needPriority.find((need) => needs.includes(need)) || needs[0];
                const meta = needMeta[primaryNeed] || needMeta.Food;
                const uniqueKey = String(data.name || doc.id).trim().toLowerCase();
                const currentItem = {
                    id: doc.id,
                    ...data,
                    specificNeed: primaryNeed,
                    image: meta.image,
                    title: meta.title
                };

                const existingItem = ngoNeedsMap.get(uniqueKey);
                if (!existingItem) {
                    ngoNeedsMap.set(uniqueKey, currentItem);
                } else {
                    const existingRank = urgencyRank[existingItem.urgency] ?? 0;
                    const currentRank = urgencyRank[currentItem.urgency] ?? 0;
                    if (currentRank > existingRank) {
                        ngoNeedsMap.set(uniqueKey, currentItem);
                    }
                }
            }
        });

        const ngoNeeds = Array.from(ngoNeedsMap.values());

        // Sort by urgency
        ngoNeeds.sort((a,b) => {
            const getVal = u => urgencyRank[u] ?? 0;
            return getVal(b.urgency) - getVal(a.urgency);
        });

        const top3 = ngoNeeds.slice(0, 3);
        urgentNeedsGrid.innerHTML = "";

        if (top3.length === 0) {
            urgentNeedsGrid.innerHTML = "<p>No urgent needs at the moment. Thank you!</p>";
            return;
        }

        top3.forEach(need => {
            const card = document.createElement('div');
            card.className = 'urgent-card';
            const urgencyClass = `badge-${(need.urgency || 'Low').toLowerCase()}`;
            card.innerHTML = `
                <img src="${need.image}" alt="${need.specificNeed}" class="urgent-card-img">
                <div class="urgent-card-content">
                    <span class="ngo-badge badge-urgency ${urgencyClass}">${need.urgency || 'Low'}</span>
                    <h3 class="urgent-title">${need.title}</h3>
                    <div class="urgent-loc">📍 ${need.location || 'Local area'}</div>
                    <p class="urgent-desc">${need.description.substring(0,60)}...</p>
                    ${currentRole === 'ngo' ? '<button type="button" class="btn btn-soft full-width urgent-action connect-ngo-btn">Connect</button>' : `<a href="donate.html#${need.specificNeed.toLowerCase()}" class="btn btn-primary full-width urgent-action">Support Now</a>`}
                </div>
            `;
            const cardImage = card.querySelector('img');
            applyImageFallback(cardImage, need.title || need.specificNeed);
            if (currentRole === 'ngo') {
                card.querySelector('.connect-ngo-btn')?.addEventListener('click', () => {
                    // Open connection confirmation modal instead of directly opening email
                    openConnectModal(need.ngoId || need.id, need.name);
                });
            }
            urgentNeedsGrid.appendChild(card);
        });

    } catch(e) {
        console.error("Error fetching urgent needs", e);
        urgentNeedsGrid.innerHTML = "<p>Failed to load urgent needs.</p>";
    }
}

function setupHomeCategoryFilters() {
    if (!categoryFilterGrid || !ngoListingGrid) return;

    const filterButtons = categoryFilterGrid.querySelectorAll('[data-filter]');
    const ngoCards = ngoListingGrid.querySelectorAll('.ngo-card[data-type]');

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const selected = button.getAttribute('data-filter');

            filterButtons.forEach((btn) => btn.classList.remove('is-active'));
            button.classList.add('is-active');

            ngoCards.forEach((card) => {
                const cardTypes = card.getAttribute('data-type') || '';
                const shouldShow = selected === 'all' || cardTypes.includes(selected);
                card.classList.toggle('hidden', !shouldShow);
            });
        });
    });
}

// Initial Load
if (db) {
    loadPublicDataOnce();
}

setupHomeCategoryFilters();
