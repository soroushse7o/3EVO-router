import { getAdapter } from "../driver.js";

export async function getSettings() {
  const db = await getAdapter();
  const row = db.get(`SELECT data FROM settings WHERE id = 1`);
  if (!row || !row.data) return {};
  try { return JSON.parse(row.data); } catch { return {}; }
}

export async function updateSettings(data) {
  const db = await getAdapter();
  db.run(`INSERT INTO settings(id, data) VALUES(1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data`, [JSON.stringify(data)]);
}

export async function isCloudEnabled() {
  const s = await getSettings();
  return !!s.cloudEnabled;
}

export async function getCloudUrl() {
  const s = await getSettings();
  return s.cloudUrl || null;
}
