// server/routes/events.js
import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { categories, venues, departmentCodes } from "../constants.js";

const router = Router();

// Returns an event in the same shape the React app uses.
// "registered" = the preset sample number + real registrations in the database.
const SELECT_EVENTS = `
  SELECT e.id, e.title, e.category, e.department, e.date, e.time,
         e.end_time AS endTime, e.venue, e.organizer, e.coordinator,
         e.registration_deadline AS registrationDeadline,
         e.description, e.capacity, e.status,
         e.base_registered +
           (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered,
         u.username AS createdBy
  FROM events e
  LEFT JOIN users u ON u.id = e.created_by
`;

function getEvent(id) {
  return db.prepare(SELECT_EVENTS + " WHERE e.id = ?").get(id);
}

function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + month + "-" + day;
}

function isRealDate(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const parsed = new Date(text + "T00:00:00Z");
  return !isNaN(parsed) && parsed.toISOString().slice(0, 10) === text;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// Looks for an already-approved event at the same venue, date and time
function findClash(venue, date, time, excludeId = -1) {
  return db
    .prepare(
      `SELECT title FROM events
       WHERE status = 'Approved' AND venue = ? AND date = ? AND time = ? AND id != ?`
    )
    .get(venue, date, time, excludeId);
}

// Checks every mandatory field. Returns { errors, value }.
// The browser (src/utils/eventValidation.js) uses the same rules.
function validateEvent(body) {
  const errors = {};
  const text = (field) => String(body[field] ?? "").trim();

  const title = text("title");
  const description = text("description");
  const organizer = text("organizer");
  const coordinator = text("coordinator");
  const category = text("category");
  const department = text("department");
  const venue = text("venue");
  const date = text("date");
  const time = text("time");
  const endTime = text("endTime");
  const deadline = text("registrationDeadline");
  const capacityText = text("capacity");
  const today = todayString();

  if (!title) errors.title = "Event name is required.";
  else if (title.length < 3 || title.length > 100) errors.title = "Event name must be 3 to 100 characters.";

  if (!description) errors.description = "Event description is required.";
  else if (description.length < 10 || description.length > 500) {
    errors.description = "Description must be 10 to 500 characters.";
  }

  if (!organizer) errors.organizer = "Organizer is required.";
  else if (organizer.length < 2 || organizer.length > 80) errors.organizer = "Organizer must be 2 to 80 characters.";

  if (!coordinator) errors.coordinator = "Faculty coordinator is required.";
  else if (!/^[A-Za-z][A-Za-z .'-]*$/.test(coordinator) || coordinator.length < 2 || coordinator.length > 60) {
    errors.coordinator = "Enter a valid name (letters, spaces, dots and hyphens only).";
  }

  if (!categories.includes(category)) errors.category = "Please select a category.";
  if (!departmentCodes.includes(department)) errors.department = "Please select a department.";
  if (!venues.includes(venue)) errors.venue = "Please select a venue.";

  if (!date) errors.date = "Event date is required.";
  else if (!isRealDate(date)) errors.date = "Please enter a valid event date.";
  else if (date < today) errors.date = "Event date cannot be in the past.";

  if (!time) errors.time = "Start time is required.";
  else if (!TIME_PATTERN.test(time)) errors.time = "Please enter a valid start time.";

  if (!endTime) errors.endTime = "End time is required.";
  else if (!TIME_PATTERN.test(endTime)) errors.endTime = "Please enter a valid end time.";
  else if (TIME_PATTERN.test(time) && endTime <= time) errors.endTime = "End time must be after the start time.";

  if (!deadline) errors.registrationDeadline = "Registration deadline is required.";
  else if (!isRealDate(deadline)) errors.registrationDeadline = "Please enter a valid registration deadline.";
  else if (deadline < today) errors.registrationDeadline = "Registration deadline cannot be in the past.";
  else if (isRealDate(date) && deadline > date) {
    errors.registrationDeadline = "Registration deadline must be on or before the event date.";
  }

  const capacity = Number(capacityText);
  if (!capacityText) errors.capacity = "Maximum participants is required.";
  else if (!/^\d+$/.test(capacityText) || capacity < 1 || capacity > 5000) {
    errors.capacity = "Maximum participants must be a whole number between 1 and 5000.";
  }

  return {
    errors,
    value: {
      title, description, organizer, coordinator, category, department, venue,
      date, time, endTime, registrationDeadline: deadline, capacity,
    },
  };
}

// GET /api/events  (what each role may see)
router.get("/", requireAuth, (req, res) => {
  const u = req.user;
  let rows;

  if (u.role === "Admin") {
    rows = db.prepare(SELECT_EVENTS + " ORDER BY e.date, e.time").all();
  } else if (u.role === "Faculty") {
    rows = db
      .prepare(
        SELECT_EVENTS +
          " WHERE e.status = 'Approved' OR e.department = ? OR e.created_by = ? ORDER BY e.date, e.time"
      )
      .all(u.department, u.id);
  } else {
    rows = db
      .prepare(SELECT_EVENTS + " WHERE e.status = 'Approved' ORDER BY e.date, e.time")
      .all();
  }

  res.json({ events: rows });
});

// POST /api/events  (Faculty submits, Admin publishes)
router.post("/", requireAuth, requireRole("Faculty", "Admin"), (req, res) => {
  const { errors, value } = validateEvent(req.body || {});
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Please correct the highlighted fields.", errors });
  }

  const clash = findClash(value.venue, value.date, value.time);
  if (clash) {
    return res.status(409).json({
      message: 'This venue and time is already taken by "' + clash.title + '".',
    });
  }

  // The server decides the status, whatever the browser sends
  const status = req.user.role === "Admin" ? "Approved" : "Pending";

  const info = db
    .prepare(
      `INSERT INTO events
        (title, category, department, date, time, end_time, venue, organizer, coordinator,
         registration_deadline, description, capacity, base_registered, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    )
    .run(
      value.title, value.category, value.department, value.date, value.time,
      value.endTime, value.venue, value.organizer, value.coordinator,
      value.registrationDeadline, value.description, value.capacity,
      status, req.user.id
    );

  res.status(201).json({
    event: getEvent(info.lastInsertRowid),
    message:
      status === "Approved"
        ? '"' + value.title + '" was published and is now visible to students.'
        : '"' + value.title + '" was submitted. It is now waiting for Admin approval.',
  });
});

// PATCH /api/events/:id/status  (Admin only)
router.patch("/:id/status", requireAuth, requireRole("Admin"), (req, res) => {
  const id = Number(req.params.id);
  const newStatus = (req.body || {}).status;

  if (!["Approved", "Rejected"].includes(newStatus)) {
    return res.status(400).json({ message: "Status must be Approved or Rejected." });
  }

  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(id);
  if (!event) return res.status(404).json({ message: "Event not found." });

  if (event.status !== "Pending") {
    return res.status(400).json({ message: "Only pending events can be approved or rejected." });
  }

  if (newStatus === "Approved") {
    const clash = findClash(event.venue, event.date, event.time, event.id);
    if (clash) {
      return res.status(409).json({
        message: 'Cannot approve: clashes with "' + clash.title + '" at the same venue and time.',
      });
    }
  }

  // A transaction does both steps together: update the event AND notify the faculty
  const decide = db.transaction(() => {
    db.prepare("UPDATE events SET status = ? WHERE id = ?").run(newStatus, id);

    if (event.created_by) {
      const creator = db.prepare("SELECT role FROM users WHERE id = ?").get(event.created_by);
      if (creator && creator.role === "Faculty") {
        db.prepare(
          "INSERT INTO notifications (user_id, event_id, message) VALUES (?, ?, ?)"
        ).run(
          event.created_by,
          event.id,
          '"' + event.title + '" was ' + newStatus.toLowerCase() + " by Admin."
        );
      }
    }
  });
  decide();

  res.json({
    event: getEvent(id),
    message:
      '"' + event.title + '" was ' + newStatus.toLowerCase() +
      ". The faculty member has been notified.",
  });
});

// DELETE /api/events/:id
router.delete("/:id", requireAuth, requireRole("Faculty", "Admin"), (req, res) => {
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(Number(req.params.id));
  if (!event) return res.status(404).json({ message: "Event not found." });

  // Faculty may only delete their own department's events or events they created
  if (
    req.user.role === "Faculty" &&
    event.department !== req.user.department &&
    event.created_by !== req.user.id
  ) {
    return res.status(403).json({ message: "You can only delete your department's events." });
  }

  db.prepare("DELETE FROM events WHERE id = ?").run(event.id);
  res.json({ ok: true });
});

export default router;