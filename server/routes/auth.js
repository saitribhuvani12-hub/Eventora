// server/routes/auth.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { checkEmail, checkNewPassword } from "../validators.js";

const router = Router();

const ROLES = ["Student", "Faculty", "Admin"];
const CODE_MINUTES = 10; // how long a reset code works
const MAX_ATTEMPTS = 5; // wrong guesses allowed per code
const COOLDOWN_SECONDS = 30; // minimum gap between two code requests

function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function sameHash(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { role, identifier, password } = req.body || {};

  if (!role || !identifier || !password) {
    return res.status(400).json({ message: "Please enter your email/username and password." });
  }

  const id = String(identifier).trim().toLowerCase();
  const user = db
    .prepare("SELECT * FROM users WHERE role = ? AND (lower(username) = ? OR lower(email) = ?)")
    .get(role, id, id);

  // Same message for "no such user" and "wrong password", so nothing leaks
  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ message: "Incorrect email/username or password." });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
});

// POST /api/auth/forgot-password  (step 1: ask for a reset code)
router.post("/forgot-password", (req, res) => {
  const { role, email } = req.body || {};

  if (!ROLES.includes(role)) {
    return res.status(400).json({ message: "Please choose a valid login type." });
  }
  const checked = checkEmail(email);
  if (checked.error) {
    return res.status(400).json({ message: checked.error, errors: { email: checked.error } });
  }

  // The same reply is sent whether or not the email exists
  const reply = {
    message:
      "If this email is registered for " + role + " login, a reset code has been sent. " +
      "It is valid for " + CODE_MINUTES + " minutes.",
  };

  const user = db
    .prepare("SELECT id, name FROM users WHERE role = ? AND lower(email) = ?")
    .get(role, checked.value);
  if (!user) return res.json(reply);

  // Do not create a new code if one was created a moment ago
  const last = db
    .prepare("SELECT created_at FROM password_resets WHERE user_id = ? ORDER BY id DESC LIMIT 1")
    .get(user.id);
  if (last && Date.now() - last.created_at < COOLDOWN_SECONDS * 1000) {
    return res.json(reply);
  }

  const code = String(crypto.randomInt(100000, 1000000)); // 6 digits
  const now = Date.now();

  db.transaction(() => {
    // Old unused codes stop working
    db.prepare("UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0").run(user.id);
    db.prepare(
      "INSERT INTO password_resets (user_id, code_hash, expires_at, created_at) VALUES (?, ?, ?, ?)"
    ).run(user.id, hashCode(code), now + CODE_MINUTES * 60 * 1000, now);
  })();

  // There is no email service, so the "email" is printed here instead
  console.log("SIMULATED EMAIL to " + checked.value + ": your Eventora reset code is " + code);

  // In demo mode the code is also sent to the page so the demo can continue
  if (process.env.DEMO_SHOW_RESET_CODE === "true") {
    return res.json({ ...reply, demoCode: code });
  }
  res.json(reply);
});

// POST /api/auth/reset-password  (step 2: code + new password)
router.post("/reset-password", (req, res) => {
  const { role, email, code, newPassword, confirmPassword } = req.body || {};

  if (!ROLES.includes(role)) {
    return res.status(400).json({ message: "Please choose a valid login type." });
  }

  const errors = {};
  const checked = checkEmail(email);
  if (checked.error) errors.email = checked.error;

  const codeText = String(code ?? "").trim();
  if (!codeText) errors.code = "Reset code is required.";
  else if (!/^\d{6}$/.test(codeText)) errors.code = "Reset code must be exactly 6 digits.";

  Object.assign(errors, checkNewPassword(newPassword, confirmPassword));

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Please correct the highlighted fields.", errors });
  }

  const invalid = { message: "Invalid or expired reset code. Please request a new one." };

  const user = db
    .prepare("SELECT id FROM users WHERE role = ? AND lower(email) = ?")
    .get(role, checked.value);
  if (!user) return res.status(400).json(invalid);

  const reset = db
    .prepare("SELECT * FROM password_resets WHERE user_id = ? AND used = 0 ORDER BY id DESC LIMIT 1")
    .get(user.id);

  if (!reset || reset.expires_at < Date.now()) return res.status(400).json(invalid);
  if (reset.attempts >= MAX_ATTEMPTS) {
    return res.status(400).json({ message: "Too many wrong attempts. Please request a new code." });
  }

  if (!sameHash(hashCode(codeText), reset.code_hash)) {
    db.prepare("UPDATE password_resets SET attempts = attempts + 1 WHERE id = ?").run(reset.id);
    return res.status(400).json(invalid);
  }

  // Everything is correct: change the password and use up the code
  const newHash = bcrypt.hashSync(String(newPassword), 10);
  db.transaction(() => {
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(newHash, user.id);
    db.prepare("UPDATE password_resets SET used = 1 WHERE user_id = ?").run(user.id);
  })();

  res.json({ message: "Your password has been reset. You can now log in with your new password." });
});

// GET /api/auth/me  (returns the logged-in user)
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;