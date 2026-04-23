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
const foodEmpty = document.getElementById('food-empty');
const clothesEmpty = document.getElementById('clothes-empty');
const moneyEmpty = document.getElementById('money-empty');
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

// NGO Dashboard DOM
const ngoProfileView = document.getElementById('ngo-profile-view');
const needsForm = document.getElementById('needs-form');
const targetAmountGroup = document.getElementById('ngo-target-amount-group');
const dashboardDonationsList = document.getElementById('dashboard-donations-list');
const donationsEmpty = document.getElementById('donations-empty');
const needsSuccess = document.getElementById('needs-success');
const needsError = document.getElementById('needs-error');
const needsCheckboxes = document.querySelectorAll('input[name="ngo-needs"]');

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
                    description: "A new NGO on the platform.",
                    needs: ["Money"],
                    urgency: "Medium",
                    targetAmount: 10000,
                    collectedAmount: 0,
                    location: "Unknown",
                    impactPerRupee: "1 rupee helps",
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
        if (homeLink) homeLink.classList.add('hidden');
        if (donateLink) donateLink.classList.add('hidden');
        
        if (!dashboardLink) {
            dashboardLink = document.createElement('a');
            dashboardLink.href = 'ngo-dashboard.html';
            dashboardLink.textContent = 'Dashboard';
            const firstLink = navLinksContainer.querySelector('a');
            if (firstLink) {
                navLinksContainer.insertBefore(dashboardLink, firstLink);
            }
        } else {
            dashboardLink.classList.remove('hidden');
        }
    } else {
        if (homeLink) homeLink.classList.remove('hidden');
        if (donateLink) donateLink.classList.remove('hidden');
        if (dashboardLink && !window.location.pathname.includes('ngo-dashboard.html')) {
            dashboardLink.classList.add('hidden');
        }
    }
}

// Auth State Observer
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
                    userInfo.textContent = `Hello, ${docSnap.data().name} (${currentRole})`;
                } else if(userInfo) {
                    currentRole = 'user';
                    userInfo.textContent = `Hello, ${user.email}`;
                }

                updateNavbarForRole(currentRole);

                // Route Protection
                const currentPath = window.location.pathname;
                const isDashboard = currentPath.includes('ngo-dashboard.html');
                const isIndex = currentPath.includes('index.html') || currentPath.endsWith('/') || currentPath.endsWith('CareConnect\\') || currentPath.endsWith('CareConnect');
                const isDonate = currentPath.includes('donate.html');

                if (currentRole === 'ngo' && (isIndex || isDonate)) {
                    window.location.href = 'ngo-dashboard.html';
                    return;
                } else if (currentRole === 'user' && isDashboard) {
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
            setJoinNgoVisibility(true);
            navLoginBtn?.classList.remove('hidden');
            navLogoutBtn?.classList.add('hidden');
            userInfo?.classList.add('hidden');
            if(userInfo) userInfo.textContent = '';
            currentRole = null;
            updateNavbarForRole(null);

            const currentPath = window.location.pathname;
            if (currentPath.includes('ngo-dashboard.html')) {
                window.location.href = 'index.html';
            }
        }
    });
}

// Fetch NGOs (Only runs if we have donation feeds present)
async function fetchVerifiedNGOs() {
    if (!foodFeed && !clothesFeed && !moneyFeed) return;
    
    if (!db) {
        if(foodFeed) foodFeed.innerHTML = "<p style='text-align:center;color:red'>Firebase not configured. Please add config.</p>";
        return;
    }
    
    if(foodFeed) foodFeed.innerHTML = "<p>Loading...</p>";
    if(clothesFeed) clothesFeed.innerHTML = "<p>Loading...</p>";
    if(moneyFeed) moneyFeed.innerHTML = "<p>Loading...</p>";

    try {
        const q = query(collection(db, "ngos"), where("verified", "==", true));
        const querySnapshot = await getDocs(q);

        if(foodFeed) foodFeed.innerHTML = "";
        if(clothesFeed) clothesFeed.innerHTML = "";
        if(moneyFeed) moneyFeed.innerHTML = "";

        let foodCount = 0, clothesCount = 0, moneyCount = 0;

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
        });

        if (foodCount === 0 && foodEmpty) foodEmpty.classList.remove('hidden');
        if (clothesCount === 0 && clothesEmpty) clothesEmpty.classList.remove('hidden');
        if (moneyCount === 0 && moneyEmpty) moneyEmpty.classList.remove('hidden');

    } catch (error) {
        console.error("Error fetching NGOs:", error);
    }
}

function renderNgoCard(id, data, type, container) {
    const card = document.createElement('div');
    card.className = 'ngo-card';

    // Calculate progress for money
    let progressPercentage = 0;
    if (data.targetAmount > 0) {
        progressPercentage = Math.min(100, Math.round((data.collectedAmount / data.targetAmount) * 100));
    }

    const needsHtml = data.needs ? data.needs.map(need => `<span>${need}</span>`).join('') : '';
    const locationText = data.location ? `<p class="ngo-location">${data.location}</p>` : '';

    card.innerHTML = `
        <div class="ngo-content">
            <div class="ngo-header">
                <h3 class="ngo-name">${data.name}</h3>
                <span class="ngo-badge badge-verified">✓ Verified</span>
            </div>
            <span class="ngo-category">${data.category}</span>
            ${locationText}
            <p class="ngo-desc">${data.description}</p>
            
            <div class="ngo-needs">
                <strong>Needs:</strong>
                <div>${needsHtml}</div>
            </div>

            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
                <div class="progress-stats">
                    <span>₹${data.collectedAmount || 0} raised</span>
                    <span>Goal: ₹${data.targetAmount || 0}</span>
                </div>
            </div>
            
            <button class="btn btn-outline full-width donate-btn" data-id="${id}" data-name="${data.name}">Donate ${type}</button>
        </div>
    `;

    container.appendChild(card);

    // Add event listener to the newly created button
    card.querySelector('.donate-btn').addEventListener('click', (e) => {
        if (!currentUser) {
            alert("Please log in to donate.");
            authModal?.classList.remove('hidden');
            return;
        }

        if (type === 'Food' || type === 'Clothes') {
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

    try {
        // 1. Create donation document
        await addDoc(collection(db, "donations"), {
            ngoId: ngoId,
            userId: currentUser.uid,
            type: type,
            amount: amount, 
            timestamp: new Date().toISOString()
        });

        // 2. If it's a money donation, update the NGO's collectedAmount
        if (amount > 0) {
            const ngoRef = doc(db, "ngos", ngoId);
            const ngoSnap = await getDoc(ngoRef);
            if (ngoSnap.exists()) {
                const currentAmount = ngoSnap.data().collectedAmount || 0;
                await updateDoc(ngoRef, {
                    collectedAmount: currentAmount + amount
                });
            }
        }

        donateSuccess.textContent = "Thank you for your donation!";
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

        goodsSuccess.textContent = "Thank you! You will be mailed the timings for collection soon.";
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
            verified: true
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
            verified: true
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
            verified: true
        },
        {
            name: "Future Scholars Org",
            category: "Education",
            description: "Providing school supplies and scholarships to promising students from low-income families.",
            needs: ["Money", "Clothes"],
            urgency: "Medium",
            targetAmount: 100000,
            collectedAmount: 45000,
            location: "Chennai",
            impactPerRupee: "₹500 = Books for a month",
            verified: true
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
            verified: false // THIS SHOULD NOT APPEAR IN THE FEED
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
                    <div style="background: #FFF3CD; color: #856404; padding: 1rem; border-radius: 8px; margin-top: 1rem; border: 1px solid #FFEEBA; font-size: 0.9rem;">
                        <strong>Action Required: Complete Verification</strong><br>
                        Your NGO profile is currently unverified. You will not appear in the donation feeds until verified.<br><br>
                        Please email your registration certificates and proof of work to <strong>support@careconnect.org</strong>. We will review your documents and verify your account within 48 hours.
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
                ${financialStats}
                ${stopDonationBtn}
                ${verificationWarning}
            `;

            const stopBtn = document.getElementById('stop-donation-btn');
            if (stopBtn) {
                stopBtn.addEventListener('click', async () => {
                    if (confirm("Are you sure you want to stop the current donation drive? This will clear your current needs.")) {
                        stopBtn.disabled = true;
                        try {
                            await updateDoc(doc(db, "ngos", currentUser.uid), {
                                needs: [],
                                targetAmount: 0
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
                const urgencyInput = document.getElementById('ngo-urgency');
                if (urgencyInput) urgencyInput.value = data.urgency || 'Low';
                
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

    const selectedNeeds = Array.from(needsCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
    const urgency = document.getElementById('ngo-urgency').value;
    let targetAmount = 0;
    
    if (selectedNeeds.includes('Money')) {
        targetAmount = Number(document.getElementById('ngo-target-amount').value);
    }

    try {
        await updateDoc(doc(db, "ngos", currentUser.uid), {
            needs: selectedNeeds,
            urgency: urgency,
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
        if(submitBtn) submitBtn.disabled = false;
    }
});

// Fetch Urgent Needs for Homepage
async function fetchUrgentNeeds() {
    if (!urgentNeedsGrid) return;
    
    if (!db) {
        urgentNeedsGrid.innerHTML = "<p>Firebase not configured.</p>";
        return;
    }

    try {
        const q = query(collection(db, "ngos"), where("verified", "==", true));
        const querySnapshot = await getDocs(q);
        
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
                    <a href="donate.html#${need.specificNeed.toLowerCase()}" class="btn btn-primary full-width urgent-action">Support Now</a>
                </div>
            `;
            const cardImage = card.querySelector('img');
            applyImageFallback(cardImage, need.title || need.specificNeed);
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
    fetchVerifiedNGOs();
    fetchUrgentNeeds();
}

setupHomeCategoryFilters();
