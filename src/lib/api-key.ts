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
    db.exec(`CREATE TABLE IF NOT EXISTS api_keys (id INTEGER PRIMARY KEY, key_hash TEXT, salt TEXT, name TEXT, created INTEGER, expires INTEGER, revoked INTEGER DEFAULT 0)`);
  }
  return db;
}

export function createApiKey(name = ""): string {
  const crypto = require("crypto");
  const salt = crypto.randomBytes(16).toString("hex");
  const key = "3evo-" + crypto.randomBytes(24).toString("hex");
  const hash = crypto.scryptSync(key, Buffer.from(salt, "hex"), 64).toString("hex");
  getDb().prepare("INSERT INTO api_keys (key_hash, salt, name, created, expires) VALUES (?, ?, ?, ?, ?)").run(hash, salt, name, Date.now(), 0);
  return key;
}

export function validateApiKey(key: string | undefined): boolean {
  if (!key) return false;
  const crypto = require("crypto");
  const cacheKey = crypto.createHash("sha256").update(key).digest("hex").slice(0, 16);
  const cache = new Map<string, boolean>();
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;
  const rows = getDb().prepare("SELECT key_hash, salt, revoked FROM api_keys").all() as { key_hash: string; salt: string; revoked: number }[];
  for (const k of rows) {
    if (k.revoked) continue;
    const hash = crypto.scryptSync(key, Buffer.from(k.salt, "hex"), 64).toString("hex");
    if (crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(k.key_hash, "hex"))) {
      cache.set(cacheKey, true);
      return true;
    }
  }
  cache.set(cacheKey, false);
  return false;
}

export function revokeApiKey(id: number) {
  getDb().prepare("UPDATE api_keys SET revoked = 1 WHERE id = ?").run(id);
}

export function listApiKeys() {
  return getDb().prepare("SELECT id, name, created, revoked FROM api_keys ORDER BY created DESC").all() as { id: number; name: string; created: number; revoked: number }[];
}

export function loadApiKeys() {
  const rows = getDb().prepare("SELECT key_hash, salt, created FROM api_keys WHERE revoked = 0").all() as { key_hash: string; salt: string; createdAt: number }[];
  return rows.map(r => ({ keyHash: r.key_hash, salt: r.salt, createdAt: r.createdAt }));
}
