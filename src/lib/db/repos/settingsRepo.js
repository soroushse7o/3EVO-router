import { getAdapter } from "../driver.js";

const DEFAULTS = {
  requireLogin: true,
  requireApiKey: true,
  rtkEnabled: false,
  observabilityEnabled: false,
};

export async function getSettings() {
  const db = await getAdapter();
  const row = db.get(`SELECT data FROM settings WHERE id = 1`);
  if (!row) return { ...DEFAULTS };
  try {
    return { ...DEFAULTS, ...JSON.parse(row.data) };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveSettings(patch) {
  const db = await getAdapter();
  const current = await getSettings();
  const merged = { ...current, ...patch };
  db.run(`INSERT INTO settings(id, data) VALUES(1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data`, [JSON.stringify(merged)]);
  return merged;
}
