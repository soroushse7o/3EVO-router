import fs from "node:fs";
import path from "node:path";
import { DATA_DIR } from "./paths.js";

const META_KEY = "schema_version";
const CURRENT_VERSION = 1;
const SCHEMA_PATH = path.join(import.meta.dirname, "migrations", "schema.sql");

export async function runMigrationOnce(adapter) {
  adapter.run(`CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT)`);
  const row = adapter.get(`SELECT value FROM _meta WHERE key = ?`, [META_KEY]);
  const currentVersion = row ? Number(row.value || 0) : 0;
  if (currentVersion >= CURRENT_VERSION) return;

  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
  for (const stmt of schema.split(";")) {
    const sql = stmt.trim();
    if (sql) adapter.run(sql);
  }

  adapter.run(`INSERT INTO _meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [META_KEY, String(CURRENT_VERSION)]);
}
