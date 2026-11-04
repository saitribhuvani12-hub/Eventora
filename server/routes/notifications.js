// server/routes/notifications.js
// Every user can only ever see and change their OWN notifications.
import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/notifications
router.get("/", requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, event_id AS eventId, message, is_read AS isRead, created_at AS createdAt
       FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50`
    )
    .all(req.user.id);

  const unreadCount = db
    .prepare("SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0")
    .get(req.user.id).n;

  res.json({
    notifications: rows.map((n) => ({ ...n, isRead: Boolean(n.isRead) })),
    unreadCount,
  });
});

// PATCH /api/notifications/read-all
router.patch("/read-all", requireAuth, (req, res) => {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").run(req.user.id);
  res.json({ ok: true });
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", requireAuth, (req, res) => {
  const result = db
    .prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?")
    .run(Number(req.params.id), req.user.id);

  if (result.changes === 0) {
    return res.status(404).json({ message: "Notification not found." });
  }
  res.json({ ok: true });
});

export default router;