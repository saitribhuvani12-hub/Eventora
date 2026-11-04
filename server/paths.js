// server/paths.js
// One place that says where uploaded files are kept.

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const uploadsDir = path.join(here, "uploads");

// Create the folder if it does not exist yet
fs.mkdirSync(uploadsDir, { recursive: true });