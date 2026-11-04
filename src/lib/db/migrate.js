import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DATA_DIR } from "./paths.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const META_KEY = "schema_version";
const CURRENT_VERSION = 3;

function findSchemaPath() {
  // In Next.js dev/Turbopack, import.meta.url may point to .next/dev/server/assets/...
  // Try multiple strategies to locate the real source file.
  const candidates = [
    path.join(__dirname, "migrations", "schema.sql"),
    path.join(process.cwd(), "src", "lib", "db", "migrations", "schema.sql"),
    path.join(process.cwd(), "migrations", "schema.sql"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  // Fallback to the original computed path even if it does not exist yet;
  // the caller will surface a clearer error if missing.
  return path.join(__dirname, "migrations", "schema.sql");
}

const SCHEMA_PATH = findSchemaPath();

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

  if (currentVersion < 3) {
    adapter.run(`CREATE TABLE IF NOT EXISTS oauth_connections (id INTEGER PRIMARY KEY AUTOINCREMENT, provider_id INTEGER NOT NULL, user_id TEXT, access_token TEXT, refresh_token TEXT, expires_at INTEGER, scope TEXT, token_type TEXT DEFAULT 'Bearer', FOREIGN KEY (provider_id) REFERENCES providers(id))`);
    adapter.run(`CREATE TABLE IF NOT EXISTS oauth_states (state TEXT PRIMARY KEY, provider_id INTEGER NOT NULL, redirect_uri TEXT, created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000), expires_at INTEGER DEFAULT (strftime('%s', 'now') * 1000 + 600000))`);
  }

  adapter.run(`INSERT INTO _meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [META_KEY, String(CURRENT_VERSION)]);
}
