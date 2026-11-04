// server/db.js
// Opens the database file, creates the tables, and adds the starting data.

import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import { makeSeedEvents } from "./seedData.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(here, "eventora.db"));
db.pragma("foreign_keys = ON"); // enforce links between tables

// ---------- Tables ----------
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    username      TEXT NOT NULL UNIQUE,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('Student', 'Faculty', 'Admin')),
    department    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS events (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    title                 TEXT NOT NULL,
    category              TEXT NOT NULL,
    department            TEXT NOT NULL,
    date                  TEXT NOT NULL,
    time                  TEXT NOT NULL,
    end_time              TEXT,
    venue                 TEXT NOT NULL,
    organizer             TEXT NOT NULL,
    coordinator           TEXT,
    registration_deadline TEXT,
    description           TEXT NOT NULL,
    capacity              INTEGER NOT NULL,
    base_registered       INTEGER NOT NULL DEFAULT 0,
    status                TEXT NOT NULL DEFAULT 'Pending'
                          CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    created_by            INTEGER REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    pass_id    TEXT NOT NULL UNIQUE,
    event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    roll_no    TEXT NOT NULL,
    email      TEXT NOT NULL,
    checked_in INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (event_id, roll_no)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id   INTEGER REFERENCES events(id) ON DELETE SET NULL,
    message    TEXT NOT NULL,
    is_read    INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS posts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id    INTEGER REFERENCES events(id) ON DELETE SET NULL,
    caption     TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    media_path  TEXT,
    media_type  TEXT CHECK (media_type IN ('image', 'video')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Password reset codes (only a hash of the code is stored)
  CREATE TABLE IF NOT EXISTS password_resets (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash  TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    attempts   INTEGER NOT NULL DEFAULT 0,
    used       INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
`);

// ---------- Upgrade an older database ----------
// If your database was made before the new event fields existed, add them now.
const eventColumns = db.prepare("PRAGMA table_info(events)").all().map((c) => c.name);
for (const [name, type] of [
  ["end_time", "TEXT"],
  ["coordinator", "TEXT"],
  ["registration_deadline", "TEXT"],
]) {
  if (!eventColumns.includes(name)) {
    db.exec("ALTER TABLE events ADD COLUMN " + name + " " + type);
  }
}

// ---------- Starting data (only when the tables are empty) ----------
const userCount = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;

if (userCount === 0) {
  const addUser = db.prepare(
    `INSERT INTO users (name, username, email, password_hash, role, department)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  // hashSync turns the password into an unreadable hash before storing it
  addUser.run("Ravi Kumar", "student", "student@eventora.edu", bcrypt.hashSync("student123", 10), "Student", "IT");
  addUser.run("Mrs. K. Mounika", "faculty", "faculty@eventora.edu", bcrypt.hashSync("faculty123", 10), "Faculty", "IT");
  addUser.run("Campus Admin", "admin", "admin@eventora.edu", bcrypt.hashSync("admin123", 10), "Admin", "GEN");
  console.log("Database: demo users added.");
}

const eventCount = db.prepare("SELECT COUNT(*) AS n FROM events").get().n;

if (eventCount === 0) {
  const facultyId = db.prepare("SELECT id FROM users WHERE username = 'faculty'").get().id;
  const addEvent = db.prepare(
    `INSERT INTO events
      (title, category, department, date, time, venue, organizer, description,
       capacity, base_registered, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  // A transaction saves all rows together, or none if something fails
  const addAll = db.transaction((events) => {
    for (const e of events) {
      addEvent.run(
        e.title, e.category, e.department, e.date, e.time, e.venue, e.organizer,
        e.description, e.capacity, e.registered, e.status,
        e.byFaculty ? facultyId : null
      );
    }
  });
  addAll(makeSeedEvents());
  console.log("Database: sample events added.");
}

// ---------- Fill in the new fields for events that do not have them ----------
// End time = start + 2 hours (latest 23:59). Coordinator = the faculty member who
// created the event, otherwise the organizer. Deadline = the event date.
db.exec(`
  UPDATE events
  SET end_time = CASE WHEN time >= '22:00' THEN '23:59'
                      ELSE strftime('%H:%M', time, '+2 hours') END
  WHERE end_time IS NULL;

  UPDATE events
  SET coordinator = COALESCE(
        (SELECT u.name FROM users u WHERE u.id = events.created_by AND u.role = 'Faculty'),
        organizer)
  WHERE coordinator IS NULL;

  UPDATE events SET registration_deadline = date WHERE registration_deadline IS NULL;
`);

export default db;