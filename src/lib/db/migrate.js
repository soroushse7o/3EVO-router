import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DATA_DIR } from "./paths.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const META_KEY = "schema_version";
const CURRENT_VERSION = 2;
const SCHEMA_PATH = path.join(__dirname, "migrations", "schema.sql");

export async function runMigrationOnce(adapter) {
  adapter.run(`CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT)`);
  const row = adapter.get(`SELECT value FROM _meta WHERE key = ?`, [META_KEY]);
  const currentVersion = row ? Number(row.value || 0) : 0;
  if (currentVersion >= CURRENT_VERSION) return;

  if (currentVersion < 1) {
    const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
    for (const stmt of schema.split(";")) {
      const sql = stmt.trim();
      if (sql) adapter.run(sql);
    }
  }

  if (currentVersion < 2) {
    adapter.run(`CREATE TABLE IF NOT EXISTS model_aliases (alias TEXT PRIMARY KEY, provider TEXT, model TEXT, fallback TEXT DEFAULT '[]')`);
    adapter.run(`CREATE TABLE IF NOT EXISTS request_details (id TEXT PRIMARY KEY, ts INTEGER, route TEXT, provider TEXT, model TEXT, ip TEXT, api_key_prefix TEXT, status INTEGER, latency_ms INTEGER, request_headers TEXT, request_body TEXT, response_headers TEXT, response_body TEXT, error TEXT)`);
  }

  adapter.run(`INSERT INTO _meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [META_KEY, String(CURRENT_VERSION)]);
}
