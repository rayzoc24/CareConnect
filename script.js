const authTrigger = document.getElementById("authTrigger");
const authModal = document.getElementById("authModal");
const closeAuth = document.getElementById("closeAuth");
const volunteerOption = document.getElementById("volunteerOption");
const foundationOption = document.getElementById("foundationOption");
const choiceView = document.getElementById("choiceView");
const volunteerView = document.getElementById("volunteerView");
const foundationView = document.getElementById("foundationView");
const backButtons = document.querySelectorAll("[data-back='true']");
const volunteerForm = document.getElementById("volunteerForm");
const volunteerStatus = document.getElementById("volunteerStatus");
const foundationForm = document.getElementById("foundationForm");
const verifyStatus = document.getElementById("verifyStatus");
const headerLoginState = document.getElementById("headerLoginState");

let currentUser = null;

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
  verifyStatus.textContent = "";
  verifyStatus.className = "verify-status";
  volunteerStatus.textContent = "";
  volunteerStatus.className = "verify-status";
}

function showVolunteerView() {
  choiceView.classList.add("hidden");
  volunteerView.classList.remove("hidden");
  foundationView.classList.add("hidden");
}

function showFoundationView() {
  choiceView.classList.add("hidden");
  volunteerView.classList.add("hidden");
  foundationView.classList.remove("hidden");
}

function updateHeaderState() {
  if (currentUser) {
    const role = currentUser.role === "foundation" ? "Foundation" : "Volunteer";
    const namePart = currentUser.orgName ? ` (${currentUser.orgName})` : "";
    headerLoginState.textContent = `Logged in as ${role}${namePart}`;
    authTrigger.textContent = "Account";
  } else {
    headerLoginState.textContent = "Not logged in";
    authTrigger.textContent = "Login/Signup";
  }
}

async function loadSession() {
  try {
    const response = await fetch("/api/auth/me");
    const data = await parseJsonResponse(response);
    currentUser = data.user;
    updateHeaderState();
  } catch (error) {
    currentUser = null;
    updateHeaderState();
  }
}

async function parseJsonResponse(response) {
  const raw = await response.text();

  try {
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    throw new Error("Server returned a non-JSON response. Make sure app is running on http://localhost:3000 using npm start.");
  }
}

async function submitAuth(endpoint, payload) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await parseJsonResponse(response);
  if (!response.ok) {
    const backendMessage = data.error || data.message;
    throw new Error(backendMessage || `Authentication failed (HTTP ${response.status})`);
  }
  return data;
}

// Basic Darpan format check: ST/YYYY/XXXXXXX
function isValidDarpanId(id) {
  const darpanPattern = /^[A-Z]{2}\/\d{4}\/\d{7}$/;
  return darpanPattern.test(id.trim().toUpperCase());
}

authTrigger.addEventListener("click", showModal);
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

volunteerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  volunteerStatus.textContent = "Processing...";
  volunteerStatus.className = "verify-status";

  try {
    const action = document.getElementById("volAction").value;
    const email = document.getElementById("volEmail").value;
    const password = document.getElementById("volPassword").value;
    const result = await submitAuth("/api/auth/volunteer", {
      action,
      email,
      password
    });

    currentUser = result.user;
    updateHeaderState();
    volunteerStatus.textContent = result.message + " Website now shows logged in.";
    volunteerStatus.className = "verify-status success";
    setTimeout(closeModal, 700);
  } catch (error) {
    volunteerStatus.textContent = error.message;
    volunteerStatus.className = "verify-status error";
  }
});

foundationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const action = document.getElementById("foundationAction").value;
  const orgName = document.getElementById("orgName").value.trim();
  const darpanInput = document.getElementById("darpanId");
  const formattedId = darpanInput.value.trim().toUpperCase();
  const email = document.getElementById("foundationEmail").value;
  const passwordInput = document.getElementById("foundationPassword");
  const password = passwordInput.value;

  if (!isValidDarpanId(formattedId)) {
    verifyStatus.textContent = "Invalid Darpan ID format. Please use ST/YYYY/XXXXXXX.";
    verifyStatus.className = "verify-status error";
    return;
  }

  verifyStatus.textContent = "Processing...";
  verifyStatus.className = "verify-status";

  try {
    const result = await submitAuth("/api/auth/foundation", {
      action,
      orgName,
      darpanId: formattedId,
      email,
      password
    });

    currentUser = result.user;
    updateHeaderState();
    verifyStatus.textContent = result.message + " Website now shows logged in.";
    verifyStatus.className = "verify-status success";
    setTimeout(closeModal, 700);
  } catch (error) {
    verifyStatus.textContent = error.message;
    verifyStatus.className = "verify-status error";
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && authModal.classList.contains("show")) {
    closeModal();
  }
});

loadSession();
