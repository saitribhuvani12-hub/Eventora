// server/routes/posts.js
import { Router } from "express";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import db from "../db.js";
import { uploadsDir } from "../paths.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const MAX_IMAGE = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO = 25 * 1024 * 1024; // 25 MB

// Multer reads the uploaded file into memory. We check it before saving anything.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO, files: 1, fields: 10 },
}).single("media"); // the form field must be named "media"

// Runs multer and turns its errors into friendly JSON messages
function handleUpload(req, res, next) {
  upload(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "File is too large. Photos up to 5 MB, videos up to 25 MB."
          : "Upload failed. Please send one photo or video.";
      return res.status(400).json({ message });
    }
    next();
  });
}

// Works out what a file really is by reading its first bytes,
// whatever its name or the browser says.
function detectMedia(buf) {
  if (buf.length < 12) return null;

  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { type: "image", ext: "jpg" };
  }
  const pngStart = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buf.subarray(0, 8).equals(pngStart)) {
    return { type: "image", ext: "png" };
  }

  const head = buf.toString("latin1", 0, 12);
  if (head.startsWith("GIF87a") || head.startsWith("GIF89a")) {
    return { type: "image", ext: "gif" };
  }
  if (head.startsWith("RIFF") && head.slice(8, 12) === "WEBP") {
    return { type: "image", ext: "webp" };
  }

  // MP4 files have "ftyp" and a brand name at bytes 4 to 12
  const mp4Brands = ["isom", "iso2", "mp41", "mp42", "avc1", "M4V ", "dash", "mmp4"];
  if (head.slice(4, 8) === "ftyp" && mp4Brands.includes(head.slice(8, 12))) {
    return { type: "video", ext: "mp4" };
  }

  // WEBM starts with the bytes 1A 45 DF A3
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return { type: "video", ext: "webm" };
  }
  return null;
}

const SELECT_POSTS = `
  SELECT p.id, p.caption, p.description, p.media_path AS mediaUrl,
         p.media_type AS mediaType, p.created_at AS createdAt,
         p.event_id AS eventId, e.title AS eventTitle,
         u.id AS authorId, u.name AS authorName, u.department AS authorDepartment
  FROM posts p
  JOIN users u ON u.id = p.user_id
  LEFT JOIN events e ON e.id = p.event_id
`;

// Shapes a database row for the browser
function toPost(row, user) {
  return {
    id: row.id,
    caption: row.caption,
    description: row.description,
    mediaUrl: row.mediaUrl,
    mediaType: row.mediaType,
    createdAt: row.createdAt.replace(" ", "T") + "Z", // a proper UTC date
    eventId: row.eventId,
    eventTitle: row.eventTitle,
    authorName: row.authorName,
    authorDepartment: row.authorDepartment,
    canDelete: user.role === "Admin" || row.authorId === user.id,
  };
}

function deleteFile(mediaPath) {
  if (!mediaPath) return;
  try {
    fs.unlinkSync(path.join(uploadsDir, path.basename(mediaPath)));
  } catch {
    // the file was already gone, nothing to do
  }
}

// GET /api/posts  (Students, Faculty and Admin can all read the feed)
router.get("/", requireAuth, (req, res) => {
  const rows = db.prepare(SELECT_POSTS + " ORDER BY p.id DESC LIMIT 100").all();
  res.json({ posts: rows.map((row) => toPost(row, req.user)) });
});

// POST /api/posts  (Students share posts)
router.post("/", requireAuth, requireRole("Student"), handleUpload, (req, res) => {
  const body = req.body || {};
  const caption = String(body.caption ?? "").trim();
  const description = String(body.description ?? "").trim();
  const errors = {};

  if (!caption) errors.caption = "Please write a caption.";
  else if (caption.length > 150) errors.caption = "Caption can be at most 150 characters.";

  if (description.length > 1000) {
    errors.description = "Description can be at most 1000 characters.";
  }

  let eventId = null;
  if (body.eventId) {
    const id = Number(body.eventId);
    const event = db.prepare("SELECT id FROM events WHERE id = ? AND status = 'Approved'").get(id);
    if (!event) errors.eventId = "Please choose a valid event.";
    else eventId = id;
  }

  let media = null;
  if (req.file) {
    const detected = detectMedia(req.file.buffer);
    if (!detected) {
      errors.media = "Only JPG, PNG, WEBP or GIF photos and MP4 or WEBM videos are allowed.";
    } else if (detected.type === "image" && req.file.size > MAX_IMAGE) {
      errors.media = "Photos must be 5 MB or smaller.";
    } else {
      media = detected;
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Please correct the highlighted fields.", errors });
  }

  // Save the file under a random name, then save the post
  let mediaPath = null;
  try {
    if (media) {
      const filename = crypto.randomBytes(12).toString("hex") + "." + media.ext;
      fs.writeFileSync(path.join(uploadsDir, filename), req.file.buffer);
      mediaPath = "/uploads/" + filename;
    }

    const info = db
      .prepare(
        `INSERT INTO posts (user_id, event_id, caption, description, media_path, media_type)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(req.user.id, eventId, caption, description, mediaPath, media ? media.type : null);

    const row = db.prepare(SELECT_POSTS + " WHERE p.id = ?").get(info.lastInsertRowid);
    res.status(201).json({ post: toPost(row, req.user), message: "Your post has been shared." });
  } catch {
    deleteFile(mediaPath); // do not leave a file behind if saving failed
    res.status(500).json({ message: "Could not save your post. Please try again." });
  }
});

// DELETE /api/posts/:id  (the author, or Admin)
router.delete("/:id", requireAuth, (req, res) => {
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(Number(req.params.id));
  if (!post) return res.status(404).json({ message: "Post not found." });

  if (req.user.role !== "Admin" && post.user_id !== req.user.id) {
    return res.status(403).json({ message: "You can only delete your own posts." });
  }

  db.prepare("DELETE FROM posts WHERE id = ?").run(post.id);
  deleteFile(post.media_path);
  res.json({ ok: true });
});

export default router;