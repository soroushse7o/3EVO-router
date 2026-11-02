import Database from "better-sqlite3";
import path from "path";
import { DATA_DIR } from "@/lib/paths";
import fs from "node:fs";

const DB_PATH = path.join(DATA_DIR, "data.db");
let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.exec(`CREATE TABLE IF NOT EXISTS sessions (session TEXT PRIMARY KEY, created INTEGER, expires INTEGER)`);
    db.exec(`CREATE TABLE IF NOT EXISTS lockout (ip TEXT PRIMARY KEY, attempts INTEGER DEFAULT 0, until INTEGER DEFAULT 0)`);
    db.exec(`CREATE TABLE IF NOT EXISTS auth (id INTEGER PRIMARY KEY CHECK (id = 1), password_hash TEXT, salt TEXT)`);
  }
  return db;
}

export function getDataDir() { return DATA_DIR; }
export { getDb };

export function hashPassword(password: string) {
  const crypto = require("node:crypto");
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return { salt: salt.toString("hex"), hash: hash.toString("hex") };
}

export function verifyPassword(password: string, saltHex: string, hashHex: string) {
  const crypto = require("node:crypto");
  const hash = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), 64);
  return crypto.timingSafeEqual(hash, Buffer.from(hashHex, "hex"));
}

export function ensureAuth() {
  const db = getDb();
  const row = db.prepare("SELECT * FROM auth WHERE id = 1").get() as any;
  if (!row?.password_hash) {
    const defaultPassword = "123456789";
    const { hash, salt } = hashPassword(defaultPassword);
    db.prepare("INSERT OR REPLACE INTO auth (id, password_hash, salt) VALUES (1, ?, ?)").run(hash, salt);
    return defaultPassword;
  }
  return null;
}

export function validatePassword(password: string) {
  const db = getDb();
  const row = db.prepare("SELECT password_hash, salt FROM auth WHERE id = 1").get() as any;
  if (!row?.password_hash) return false;
  return verifyPassword(password, row.salt, row.password_hash);
}

export async function createSession() {
  const { createDashboardAuthToken } = await import("./auth/dashboardSession.js");
  return createDashboardAuthToken("dashboard");
}

export async function validateSession(session: string | undefined): Promise<boolean> {
  if (!session) return false;
  const { verifyDashboardAuthToken } = await import("./auth/dashboardSession.js");
  return await verifyDashboardAuthToken(session);
}

export async function destroySession(session: string | undefined) {
  if (!session) return;
  getDb().prepare("DELETE FROM sessions WHERE session = ?").run(session);
}

export function requireAuth(req: any) {
  const token = req?.cookies?.get?.("session")?.value;
  if (!token) {
    const err = new Error("unauthorized") as any;
    err.status = 401;
    throw err;
  }
  return { token };
}

export function checkLockout(ip: string) {
  const db = getDb();
  const row = db.prepare("SELECT attempts, until FROM lockout WHERE ip = ?").get(ip) as any;
  return { locked: row ? Date.now() < row.until : false, until: row?.until || 0, attempts: row?.attempts || 0 };
}

export function recordFailedAuth(ip: string) {
  const db = getDb();
  const row = db.prepare("SELECT attempts, until FROM lockout WHERE ip = ?").get(ip) as any;
  const now = Date.now();
  const until = row && now < row.until ? row.until : 0;
  const attempts = until ? row.attempts : (row?.attempts || 0) + 1;
  const newUntil = attempts >= 3 ? now + Math.pow(2, attempts - 2) * 1000 : 0;
  db.prepare("INSERT OR REPLACE INTO lockout (ip, attempts, until) VALUES (?, ?, ?)").run(ip, attempts, newUntil);
  return { locked: newUntil > 0 && now < newUntil, until: newUntil, attempts };
}

export function clearLockout(ip: string) {
  getDb().prepare("DELETE FROM lockout WHERE ip = ?").run(ip);
}
