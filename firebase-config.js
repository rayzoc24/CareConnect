function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getApiBase() {
  if (typeof window !== "undefined" && window.location && window.location.protocol === "file:") {
    return "http://localhost:3000";
  }
  return "";
}

async function apiAuth(path, payload) {
  const url = `${getApiBase()}${path}`;
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    throw new Error("Cannot reach backend. Open the app via http://localhost:3000 and ensure server is running.");
  }

  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    const fallback = raw && raw.trim() ? `Auth request failed (${response.status})` : "Auth request failed.";
    throw new Error(data.error || fallback);
  }

  const user = data.user || {};
  return {
    uid: user.id,
    role: user.role,
    name: user.name,
    email: normalizeEmail(user.email),
    darpanId: user.darpanId || ""
  };
}

window.mockAuth = {
  async registerVolunteer(name, email, phone, password) {
    return apiAuth("/api/auth/volunteer", {
      action: "signup",
      name,
      email: normalizeEmail(email),
      phone: String(phone || "").trim(),
      password
    });
  },

  async loginVolunteer(email, password) {
    return apiAuth("/api/auth/volunteer", {
      action: "login",
      email: normalizeEmail(email),
      password
    });
  },

  async registerFoundation(name, darpanId, email, password) {
    return apiAuth("/api/auth/foundation", {
      action: "signup",
      orgName: name,
      darpanId: String(darpanId || "").trim().toUpperCase(),
      email: normalizeEmail(email),
      password
    });
  },

  async loginFoundation(email, password) {
    return apiAuth("/api/auth/foundation", {
      action: "login",
      email: normalizeEmail(email),
      password
    });
  }
};
