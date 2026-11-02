import { getAdapter } from "../driver.js";

const TABLE_SQL = `CREATE TABLE IF NOT EXISTS kv (scope TEXT, key TEXT, value TEXT, PRIMARY KEY(scope, key))`;

export async function initKv() {
  const db = await getAdapter();
  db.run(TABLE_SQL);
}

export async function kvGet(scope, key) {
  const db = await getAdapter();
  const row = db.get(`SELECT value FROM kv WHERE scope = ? AND key = ?`, [scope, key]);
  if (!row) return null;
  try { return JSON.parse(row.value); } catch { return row.value; }
}

export async function kvSet(scope, key, value) {
  const db = await getAdapter();
  db.run(`INSERT INTO kv(scope, key, value) VALUES(?, ?, ?) ON CONFLICT(scope, key) DO UPDATE SET value = excluded.value`, [scope, key, JSON.stringify(value)]);
}

export async function kvDel(scope, key) {
  const db = await getAdapter();
  db.run(`DELETE FROM kv WHERE scope = ? AND key = ?`, [scope, key]);
}

export async function kvClear(scope) {
  const db = await getAdapter();
  db.run(`DELETE FROM kv WHERE scope = ?`, [scope]);
}
