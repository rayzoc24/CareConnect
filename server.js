require("dotenv").config();

const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "careconnect";

let pool;

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "careconnect-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax"
    }
  })
);

app.use(express.static(__dirname));

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ error: "Invalid JSON in request body." });
    return;
  }
  next(error);
});

function isValidDarpanId(id) {
  return /^[A-Z]{2}\/\d{4}\/\d{7}$/.test((id || "").trim().toUpperCase());
}

async function initializeDatabase() {
  const rootConnection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true
  });

  await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await rootConnection.end();

  pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      role VARCHAR(32) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      org_name VARCHAR(255) NULL,
      darpan_id VARCHAR(32) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function findUserByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  return rows[0] || null;
}

async function createUser(user) {
  const sql = `
    INSERT INTO users (role, email, password_hash, org_name, darpan_id)
    VALUES (?, ?, ?, ?, ?)
  `;
  const params = [
    user.role,
    user.email,
    user.passwordHash,
    user.orgName || null,
    user.darpanId || null
  ];

  const [result] = await pool.query(sql, params);
  return result.insertId;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
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

    if (expectedRole === "foundation" && action === "signup") {
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

    const existingUser = await findUserByEmail(email);

    if (action === "signup") {
      if (existingUser) {
        res.status(409).json({ error: "User already exists. Please login." });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await createUser({
        role: expectedRole,
        email,
        passwordHash,
        orgName: expectedRole === "foundation" ? String(req.body.orgName || "").trim() : null,
        darpanId: expectedRole === "foundation" ? String(req.body.darpanId || "").trim().toUpperCase() : null
      });

      const createdUser = await findUserByEmail(email);
      req.session.user = {
        id: createdUser.id,
        role: createdUser.role,
        email: createdUser.email,
        orgName: createdUser.org_name || null
      };

      res.json({
        message: "Signup successful.",
        user: req.session.user
      });
      return;
    }

    if (!existingUser) {
      res.status(404).json({ error: "User not found. Please signup first." });
      return;
    }

    if (existingUser.role !== expectedRole) {
      res.status(403).json({ error: "Role mismatch for this account." });
      return;
    }

    const validPassword = await bcrypt.compare(password, existingUser.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: "Incorrect password." });
      return;
    }

    req.session.user = {
      id: existingUser.id,
      role: existingUser.role,
      email: existingUser.email,
      orgName: existingUser.org_name || null
    };

    res.json({
      message: "Login successful.",
      user: req.session.user
    });
  } catch (error) {
    if (error && error.code === "ER_DUP_ENTRY") {
      res.status(409).json({ error: "User already exists. Please login." });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
}

app.post("/api/auth/volunteer", (req, res) => {
  handleAuth(req, res, "volunteer");
});

app.post("/api/auth/foundation", (req, res) => {
  handleAuth(req, res, "foundation");
});

app.get("/api/auth/me", (req, res) => {
  res.json({ user: req.session.user || null });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out." });
  });
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`CareConnect server running at http://localhost:${PORT}`);
      console.log(`MySQL connected: ${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize MySQL database.");
    console.error(error.message);
    process.exit(1);
  });
