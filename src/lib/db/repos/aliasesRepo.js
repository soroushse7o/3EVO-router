import { getAdapter } from "../driver.js";

export async function listAliases() {
  const db = await getAdapter();
  const rows = db.all(`SELECT * FROM model_aliases ORDER BY alias ASC`);
  return rows.map(r => ({ alias: r.alias, provider: r.provider, model: r.model, fallback: r.fallback ? JSON.parse(r.fallback) : [] }));
}

export async function getAlias(alias) {
  const db = await getAdapter();
  const row = db.get(`SELECT * FROM model_aliases WHERE alias = ?`, [alias]);
  if (!row) return null;
  return { alias: row.alias, provider: row.provider, model: row.model, fallback: row.fallback ? JSON.parse(row.fallback) : [] };
}

export async function createAlias(alias, provider, model, fallback = []) {
  const db = await getAdapter();
  db.run(`INSERT INTO model_aliases(alias, provider, model, fallback) VALUES(?, ?, ?, ?)`, [alias, provider, model, JSON.stringify(fallback)]);
}

export async function updateAlias(alias, patch) {
  const db = await getAdapter();
  const current = await getAlias(alias);
  if (!current) return null;
  const merged = { ...current, ...patch };
  db.run(`UPDATE model_aliases SET provider = ?, model = ?, fallback = ? WHERE alias = ?`, [merged.provider, merged.model, JSON.stringify(merged.fallback), alias]);
  return merged;
}

export async function deleteAlias(alias) {
  const db = await getAdapter();
  db.run(`DELETE FROM model_aliases WHERE alias = ?`, [alias]);
}
