import Database from "better-sqlite3";
import path from "path";
import { DATA_DIR } from "@/lib/paths";
import fs from "fs";

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

export function hashPassword(password: string) {
  const crypto = require("crypto");
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return { salt: salt.toString("hex"), hash: hash.toString("hex") };
}

export function verifyPassword(password: string, saltHex: string, hashHex: string) {
  const crypto = require("crypto");
  const hash = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), 64);
  return crypto.timingSafeEqual(hash, Buffer.from(hashHex, "hex"));
}

export function ensureAuth() {
  const db = getDb();
  const row = db.prepare("SELECT * FROM auth WHERE id = 1").get() as { password_hash?: string } | undefined;
  if (!row?.password_hash) {
    const crypto = require("crypto");
    const pw = process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString("hex");
    const { hash, salt } = hashPassword(pw);
    db.prepare("INSERT OR REPLACE INTO auth (id, password_hash, salt) VALUES (1, ?, ?)").run(hash, salt);
  }
}

export function validatePassword(password: string) {
  const db = getDb();
  const row = db.prepare("SELECT password_hash, salt FROM auth WHERE id = 1").get() as { password_hash?: string; salt?: string } | undefined;
  if (!row?.password_hash) return false;
  return verifyPassword(password, row.salt, row.password_hash);
}

export function createSession(): string {
  const db = getDb();
  const crypto = require("crypto");
  const session = crypto.randomBytes(32).toString("hex");
  const ttl = 86400;
  db.prepare("INSERT INTO sessions (session, created, expires) VALUES (?, ?, ?)").run(session, Date.now(), Date.now() + ttl * 1000);
  return session;
}

export function validateSession(session: string | undefined): boolean {
  if (!session) return false;
  const db = getDb();
  const row = db.prepare("SELECT expires FROM sessions WHERE session = ?").get(session) as { expires: number } | undefined;
  if (!row) return false;
  if (row.expires < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE session = ?").run(session);
    return false;
  }
  return true;
}

export function destroySession(session: string | undefined) {
  if (!session) return;
  getDb().prepare("DELETE FROM sessions WHERE session = ?").run(session);
}

export function requireAuth(req: any) {
  const session = req?.cookies?.get?.("session")?.value;
  if (!session || !validateSession(session)) {
    const err = new Error("unauthorized") as any;
    err.status = 401;
    throw err;
  }
  return { session };
}

export function checkLockout() {
  const db = getDb();
  const row = db.prepare("SELECT attempts, until FROM lockout WHERE ip = 'global'").get() as { attempts: number; until: number } | undefined;
  return { locked: row ? Date.now() < row.until : false, until: row?.until || 0, attempts: row?.attempts || 0 };
}

export function recordFailedAuth(ip: string) {
  const db = getDb();
  const row = db.prepare("SELECT attempts, until FROM lockout WHERE ip = ?").get(ip) as { attempts: number; until: number } | undefined;
  const now = Date.now();
  const until = row && now < row.until ? row.until : 0;
  const attempts = until ? row.attempts : (row?.attempts || 0) + 1;
  const newUntil = attempts >= 3 ? now + Math.pow(2, attempts - 3) * 1000 : 0;
  db.prepare("INSERT OR REPLACE INTO lockout (ip, attempts, until) VALUES (?, ?, ?)").run(ip, attempts, newUntil);
  return { locked: newUntil > 0 && now < newUntil, until: newUntil, attempts };
}

export function clearLockout() {
  getDb().prepare("DELETE FROM lockout").run();
}
