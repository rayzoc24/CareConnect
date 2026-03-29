const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { normalizeEmail, isValidDarpanId } = require("../utils/authUtils");

function buildSessionUser(user) {
  return {
    id: String(user._id),
    role: user.role,
    email: user.email,
    name: user.role === "volunteer" ? user.name : user.orgName,
    orgName: user.orgName || "",
    darpanId: user.darpanId || ""
  };
}

async function handleAuth(req, res, expectedRole) {
  try {
    const action = String(req.body.action || "").trim().toLowerCase();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (action !== "signup" && action !== "login") {
      res.status(400).json({ error: "Action must be signup or login." });
      return;
    }

    if (!email || !password || password.length < 6) {
      res.status(400).json({ error: "Email and password (min 6 chars) are required." });
      return;
    }

    const existing = await User.findOne({ email }).lean();

    if (action === "signup") {
      if (existing) {
        res.status(409).json({ error: "User already exists. Please login." });
        return;
      }

      if (expectedRole === "volunteer") {
        const name = String(req.body.name || "").trim();
        if (!name) {
          res.status(400).json({ error: "Volunteer name is required." });
          return;
        }
      }

      if (expectedRole === "foundation") {
        const orgName = String(req.body.orgName || "").trim();
        const darpanId = String(req.body.darpanId || "").trim().toUpperCase();
        if (!orgName) {
          res.status(400).json({ error: "Foundation name is required." });
          return;
        }
        if (!isValidDarpanId(darpanId)) {
          res.status(400).json({ error: "Invalid Darpan ID format." });
          return;
        }
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const created = await User.create({
        role: expectedRole,
        email,
        passwordHash,
        name: expectedRole === "volunteer" ? String(req.body.name || "").trim() : "",
        phone: expectedRole === "volunteer" ? String(req.body.phone || "").trim() : "",
        orgName: expectedRole === "foundation" ? String(req.body.orgName || "").trim() : "",
        darpanId: expectedRole === "foundation" ? String(req.body.darpanId || "").trim().toUpperCase() : ""
      });

      const user = buildSessionUser(created);
      req.session.user = user;
      res.json({ message: "Signup successful.", user });
      return;
    }

    if (!existing) {
      res.status(404).json({ error: "User not found. Please signup first." });
      return;
    }

    if (existing.role !== expectedRole) {
      res.status(403).json({ error: "Role mismatch for this account." });
      return;
    }

    const validPassword = await bcrypt.compare(password, existing.passwordHash);
    if (!validPassword) {
      res.status(401).json({ error: "Incorrect password." });
      return;
    }

    const user = buildSessionUser(existing);
    req.session.user = user;
    res.json({ message: "Login successful.", user });
  } catch (error) {
    if (error && error.code === 11000) {
      res.status(409).json({ error: "User already exists. Please login." });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
}

function volunteerAuth(req, res) {
  return handleAuth(req, res, "volunteer");
}

function foundationAuth(req, res) {
  return handleAuth(req, res, "foundation");
}

function me(req, res) {
  res.json({ user: req.session.user || null });
}

function logout(req, res) {
  req.session.destroy(() => {
    res.json({ message: "Logged out." });
  });
}

module.exports = {
  volunteerAuth,
  foundationAuth,
  me,
  logout
};
