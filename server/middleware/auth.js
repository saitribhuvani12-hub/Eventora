// server/middleware/auth.js
// "Gatekeepers" that run before a route to check who is calling.

import jwt from "jsonwebtoken";
import db from "../db.js";

// 1. Is the person logged in? Reads the token from the request header.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Please log in first." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = db
      .prepare("SELECT id, name, username, email, role, department FROM users WHERE id = ?")
      .get(payload.id);

    if (!user) {
      return res.status(401).json({ message: "This account no longer exists." });
    }

    req.user = user; // available to the route that runs next
    next();
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please log in again." });
  }
}

// 2. Does the logged-in person have the right role?
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to do this." });
    }
    next();
  };
}