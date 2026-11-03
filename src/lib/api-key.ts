import { getAdapter } from "@/lib/db/driver";
import { DATA_DIR } from "@/lib/paths";

async function getDb() {
  const db = await getAdapter();
  db.run(`CREATE TABLE IF NOT EXISTS api_keys (id INTEGER PRIMARY KEY, key_hash TEXT, salt TEXT, name TEXT, created INTEGER, expires INTEGER, revoked INTEGER DEFAULT 0)`);
  return db;
}

export async function createApiKey(name = ""): Promise<string> {
  const crypto = require("crypto");
  const salt = crypto.randomBytes(16).toString("hex");
  const key = "3evo-" + crypto.randomBytes(24).toString("hex");
  const hash = crypto.scryptSync(key, Buffer.from(salt, "hex"), 64).toString("hex");
  const db = await getDb();
  db.run("INSERT INTO api_keys (key_hash, salt, name, created, expires) VALUES (?, ?, ?, ?, ?)", [hash, salt, name, Date.now(), 0]);
  return key;
}

export async function validateApiKey(key: string | undefined): Promise<boolean> {
  if (!key) return false;
  const crypto = require("crypto");
  const db = await getDb();
  const rows = db.all("SELECT key_hash, salt, revoked FROM api_keys") as { key_hash: string; salt: string; revoked: number }[];
  for (const k of rows) {
    if (k.revoked) continue;
    const hash = crypto.scryptSync(key, Buffer.from(k.salt, "hex"), 64).toString("hex");
    if (crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(k.key_hash, "hex"))) {
      return true;
    }
  }
  return false;
}

export async function revokeApiKey(id: number): Promise<void> {
  const db = await getDb();
  db.run("UPDATE api_keys SET revoked = 1 WHERE id = ?", [id]);
}

export async function listApiKeys(): Promise<{ id: number; name: string; created: number; revoked: number }[]> {
  const db = await getDb();
  return db.all("SELECT id, name, created, revoked FROM api_keys ORDER BY created DESC") as { id: number; name: string; created: number; revoked: number }[];
}

export async function loadApiKeys(): Promise<{ keyHash: string; salt: string; createdAt: number }[]> {
  const db = await getDb();
  const rows = db.all("SELECT key_hash, salt, created FROM api_keys WHERE revoked = 0") as { key_hash: string; salt: string; created: number }[];
  return rows.map(r => ({ keyHash: r.key_hash, salt: r.salt, createdAt: r.created }));
}
