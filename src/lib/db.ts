import Database from "better-sqlite3";
import path from "path";
import { DATA_DIR } from "@/lib/paths";
import fs from "fs";

const dir = DATA_DIR;
fs.mkdirSync(dir, { recursive: true });
const db = new Database(path.join(dir, "data.db"));
function getDb(): Database.Database { return db; }
export { getDb };
db.exec(`CREATE TABLE IF NOT EXISTS usage (id INTEGER PRIMARY KEY, ts INTEGER, provider TEXT, model TEXT, tokens_in INTEGER, tokens_out INTEGER, rtk_saved INTEGER)`);
db.exec(`CREATE TABLE IF NOT EXISTS quota (provider TEXT, model TEXT, limit_in INTEGER, limit_out INTEGER, PRIMARY KEY(provider, model))`);
db.exec(`CREATE TABLE IF NOT EXISTS sessions (session TEXT PRIMARY KEY, created INTEGER, expires INTEGER)`);
db.exec(`CREATE TABLE IF NOT EXISTS api_keys (id INTEGER PRIMARY KEY, key_hash TEXT, salt TEXT, name TEXT, created INTEGER, expires INTEGER, revoked INTEGER DEFAULT 0)`);
db.exec(`CREATE TABLE IF NOT EXISTS lockout (ip TEXT PRIMARY KEY, attempts INTEGER DEFAULT 0, until INTEGER DEFAULT 0)`);
db.exec(`CREATE TABLE IF NOT EXISTS auth (id INTEGER PRIMARY KEY CHECK (id = 1), password_hash TEXT, salt TEXT)`);
db.exec(`CREATE TABLE IF NOT EXISTS providers (id INTEGER PRIMARY KEY, name TEXT, base_url TEXT, api_key_enc TEXT, model TEXT, created INTEGER)`);

export function recordUsage(provider: string, model: string, tin: number, tout: number, saved: number) {
  db.prepare("INSERT INTO usage (ts,provider,model,tokens_in,tokens_out,rtk_saved) VALUES (?,?,?,?,?,?)").run(Date.now(), provider, model, tin, tout, saved);
}

export function getUsage() {
  return db.prepare("SELECT * FROM usage ORDER BY ts DESC LIMIT 100").all();
}

export function setQuota(provider: string, model: string, limitIn: number, limitOut: number) {
  db.prepare("INSERT OR REPLACE INTO quota (provider, model, limit_in, limit_out) VALUES (?,?,?,?)").run(provider, model, limitIn, limitOut);
}

export function getQuota() {
  return db.prepare("SELECT * FROM quota").all();
}

export function getUsageAggregates() {
  return db.prepare("SELECT provider, model, sum(tokens_in) as tokens_in, sum(tokens_out) as tokens_out, count(*) as requests FROM usage GROUP BY provider, model").all();
}

export function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  if (model.startsWith("gpt-4") || model.includes("claude")) {
    return ((tokensIn + tokensOut) / 1_000_000) * 3;
  }
  return ((tokensIn + tokensOut) / 1_000_000) * 1;
}

export function createProvider(name: string, baseUrl: string, apiKey: string, model: string) {
  const { encrypt, masterKey } = require("@/lib/vault");
  const enc = encrypt(apiKey, masterKey());
  getDb().prepare("INSERT INTO providers (name, base_url, api_key_enc, model, created) VALUES (?, ?, ?, ?, ?)").run(name, baseUrl, enc, model, Date.now());
}

export function listProviders() {
  const rows = getDb().prepare("SELECT id, name, base_url, model, created FROM providers ORDER BY created DESC").all() as { id: number; name: string; base_url: string; model: string; created: number }[];
  return rows;
}

export function getProvider(id: number) {
  const row = getDb().prepare("SELECT id, name, base_url, api_key_enc, model, created FROM providers WHERE id = ?").get(id) as { id: number; name: string; base_url: string; api_key_enc: string; model: string; created: number } | undefined;
  return row;
}

export function deleteProvider(id: number) {
  getDb().prepare("DELETE FROM providers WHERE id = ?").run(id);
}
