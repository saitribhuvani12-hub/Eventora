import "dotenv/config"; // loads the settings from the .env file
import express from "express";
import "./db.js"; // opens the database and creates the tables
import { uploadsDir } from "./paths.js";
import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import notificationRoutes from "./routes/notifications.js";
import registrationRoutes from "./routes/registrations.js";
import postRoutes from "./routes/posts.js";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Add it to server/.env");
  process.exit(1);
}

const app = express();
app.use(express.json()); // lets the server read JSON sent by the browser

// Uploaded photos and videos are served from /uploads/...
app.use(
  "/uploads",
  express.static(uploadsDir, {
    setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
  })
);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Eventora server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/posts", postRoutes);

// Any other /api address does not exist
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Not found." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, (err) => {
  if (err) {
    console.error("Could not start the server: " + err.message);
    process.exit(1);
  }
  console.log("Eventora server running on http://localhost:" + PORT);
});