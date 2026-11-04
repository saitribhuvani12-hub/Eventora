// server/routes/registrations.js
import { Router } from "express";
import crypto from "crypto";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateRegistration } from "../validators.js";

const router = Router();

function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + month + "-" + day;
}

// Turns a database row into the shape the React app uses
function toRegistration(row) {
  return {
    id: row.id, // the Pass ID shown in the QR code
    eventId: row.eventId,
    name: row.name,
    rollNo: row.rollNo,
    email: row.email,
    checkedIn: Boolean(row.checkedIn),
  };
}

const SELECT_REG = `
  SELECT pass_id AS id, event_id AS eventId, name, roll_no AS rollNo,
         email, checked_in AS checkedIn
  FROM registrations
`;

// POST /api/registrations  (Student registers for an event)
router.post("/", requireAuth, requireRole("Student"), (req, res) => {
  const body = req.body || {};
  const { errors, value } = validateRegistration(body);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Please correct the highlighted fields.", errors });
  }

  const eventId = Number(body.eventId);

  // A transaction makes the checks and the save happen together
  const register = db.transaction(() => {
    const event = db
      .prepare(
                `SELECT id, title, date, status, capacity, registration_deadline,
                base_registered +
                  (SELECT COUNT(*) FROM registrations WHERE event_id = events.id) AS registered
         FROM events WHERE id = ?`
      )
      .get(eventId);

    if (!event) return { code: 404, message: "Event not found." };
    if (event.status !== "Approved") {
      return { code: 400, message: "This event is not open for registration." };
    }
    if (event.date < todayString()) {
      return { code: 400, message: "Registration is closed because this event has already taken place." };
    }
        if (event.registration_deadline && event.registration_deadline < todayString()) {
      return { code: 400, message: "The registration deadline for this event has passed." };
    }
    if (event.registered >= event.capacity) {
      return { code: 409, message: "Sorry, this event is full." };
    }

    const duplicate = db
      .prepare("SELECT 1 FROM registrations WHERE event_id = ? AND roll_no = ?")
      .get(eventId, value.rollNo);
    if (duplicate) {
      return { code: 409, message: "This roll number is already registered for this event." };
    }

    const passId = "REG-" + crypto.randomBytes(5).toString("hex").toUpperCase();
    db.prepare(
      `INSERT INTO registrations (pass_id, event_id, user_id, name, roll_no, email)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(passId, eventId, req.user.id, value.name, value.rollNo, value.email);

    return {
      code: 201,
      registration: { id: passId, eventId, name: value.name, rollNo: value.rollNo, email: value.email, checkedIn: false },
    };
  });

  const result = register();

  if (result.code !== 201) {
    return res.status(result.code).json({ message: result.message });
  }
  res.status(201).json({
    registration: result.registration,
    message: "Registration successful! Your pass is below.",
  });
});

// GET /api/registrations/mine  (a student's own passes)
router.get("/mine", requireAuth, requireRole("Student"), (req, res) => {
  const rows = db.prepare(SELECT_REG + " WHERE user_id = ? ORDER BY id DESC").all(req.user.id);
  res.json({ registrations: rows.map(toRegistration) });
});

// GET /api/registrations  (Admin: everyone, optionally for one event)
router.get("/", requireAuth, requireRole("Admin"), (req, res) => {
  const eventId = Number(req.query.eventId);
  const rows = eventId
    ? db.prepare(SELECT_REG + " WHERE event_id = ? ORDER BY id").all(eventId)
    : db.prepare(SELECT_REG + " ORDER BY id").all();
  res.json({ registrations: rows.map(toRegistration) });
});

// POST /api/registrations/checkin  (Admin scans a pass)
router.post("/checkin", requireAuth, requireRole("Admin"), (req, res) => {
  const passId = String((req.body || {}).passId || "").trim();
  if (!passId) {
    return res.status(400).json({ message: "Enter a Pass ID first." });
  }

  const reg = db.prepare("SELECT * FROM registrations WHERE pass_id = ?").get(passId);
  if (!reg) {
    return res.status(404).json({ message: "Invalid pass: no registration found with this ID." });
  }
  if (reg.checked_in) {
    return res.status(409).json({ message: reg.name + " is already checked in." });
  }

  db.prepare("UPDATE registrations SET checked_in = 1 WHERE id = ?").run(reg.id);
  res.json({ message: "✅ " + reg.name + " checked in successfully." });
});

// DELETE /api/registrations/:passId  (Student cancels their own pass)
router.delete("/:passId", requireAuth, requireRole("Student"), (req, res) => {
  const reg = db
    .prepare("SELECT * FROM registrations WHERE pass_id = ? AND user_id = ?")
    .get(req.params.passId, req.user.id);

  if (!reg) return res.status(404).json({ message: "Registration not found." });
  if (reg.checked_in) {
    return res.status(400).json({ message: "A checked-in registration cannot be cancelled." });
  }

  db.prepare("DELETE FROM registrations WHERE id = ?").run(reg.id);
  res.json({ ok: true });
});

export default router;