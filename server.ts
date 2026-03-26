import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("app.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    min_earn INTEGER NOT NULL,
    max_earn INTEGER NOT NULL,
    surveys INTEGER NOT NULL,
    tier TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/auth/signup", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    try {
      const stmt = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)");
      const result = stmt.run(email, hashPassword(password));
      res.json({ id: result.lastInsertRowid, email });
    } catch (err: any) {
      if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const stmt = db.prepare("SELECT * FROM users WHERE email = ? AND password_hash = ?");
    const user = stmt.get(email, hashPassword(password)) as any;

    if (user) {
      res.json({ id: user.id, email: user.email });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/results", (req, res) => {
    const { userId, min, max, surveys, tier } = req.body;
    if (!userId || min === undefined || max === undefined || surveys === undefined || !tier) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const stmt = db.prepare("INSERT INTO results (user_id, min_earn, max_earn, surveys, tier) VALUES (?, ?, ?, ?, ?)");
      const result = stmt.run(userId, min, max, surveys, tier);
      res.json({ id: result.lastInsertRowid });
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/results/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const stmt = db.prepare("SELECT * FROM results WHERE user_id = ? ORDER BY created_at DESC");
      const results = stmt.all(userId);
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
