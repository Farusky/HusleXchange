import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(cors({ origin: true, credentials: true }));

  // Initialize Database
  const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      skillsOffered TEXT,
      skillsWanted TEXT,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      userName TEXT NOT NULL,
      offer TEXT NOT NULL,
      need TEXT NOT NULL,
      phone TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(uid)
    );
  `);

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: "Missing fields" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const uid = Math.random().toString(36).substring(2, 15);
      const createdAt = Date.now();

      await db.run(
        "INSERT INTO users (uid, name, email, password, phone, createdAt, skillsOffered, skillsWanted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [uid, name, email, hashedPassword, phone, createdAt, "[]", "[]"]
      );

      const token = jwt.sign({ uid, email, name }, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
      res.json({ uid, name, email, phone, createdAt });
    } catch (err: any) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ uid: user.uid, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
    res.json({ uid: user.uid, name: user.name, email: user.email, phone: user.phone, createdAt: user.createdAt });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  app.get("/api/auth/me", authenticate, async (req: any, res) => {
    const user = await db.get("SELECT uid, name, email, phone, skillsOffered, skillsWanted, createdAt FROM users WHERE uid = ?", [req.user.uid]);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    res.json({
      ...user,
      skillsOffered: JSON.parse(user.skillsOffered || "[]"),
      skillsWanted: JSON.parse(user.skillsWanted || "[]")
    });
  });

  // Profile Routes
  app.put("/api/profile", authenticate, async (req: any, res) => {
    const { name, phone, skillsOffered, skillsWanted } = req.body;
    const uid = req.user.uid;

    const updates: string[] = [];
    const params: any[] = [];

    if (name) { updates.push("name = ?"); params.push(name); }
    if (phone) { updates.push("phone = ?"); params.push(phone); }
    if (skillsOffered) { updates.push("skillsOffered = ?"); params.push(JSON.stringify(skillsOffered)); }
    if (skillsWanted) { updates.push("skillsWanted = ?"); params.push(JSON.stringify(skillsWanted)); }

    if (updates.length === 0) return res.status(400).json({ error: "No updates provided" });

    params.push(uid);
    await db.run(`UPDATE users SET ${updates.join(", ")} WHERE uid = ?`, params);
    res.json({ success: true });
  });

  // Post Routes
  app.get("/api/posts", async (req, res) => {
    const posts = await db.all("SELECT * FROM posts ORDER BY createdAt DESC");
    res.json(posts);
  });

  app.post("/api/posts", authenticate, async (req: any, res) => {
    const { offer, need } = req.body;
    const { uid, name } = req.user;

    const user = await db.get("SELECT phone FROM users WHERE uid = ?", [uid]);
    if (!user) return res.status(404).json({ error: "User not found" });

    const id = Math.random().toString(36).substring(2, 15);
    const createdAt = Date.now();

    await db.run(
      "INSERT INTO posts (id, userId, userName, offer, need, phone, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, uid, name, offer, need, user.phone, createdAt]
    );

    res.json({ id, userId: uid, userName: name, offer, need, phone: user.phone, createdAt });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
