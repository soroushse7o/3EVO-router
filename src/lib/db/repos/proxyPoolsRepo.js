import { getAdapter } from "../driver.js";

export async function getProxyPools() {
  const db = await getAdapter();
  return db.all(`SELECT id, isActive, testStatus, data, createdAt, updatedAt FROM proxyPools`).map(r => ({ ...JSON.parse(r.data || "{}"), id: r.id, isActive: !!r.isActive, testStatus: r.testStatus, createdAt: r.createdAt, updatedAt: r.updatedAt }));
}

export async function getProxyPoolById(id) {
  const db = await getAdapter();
  const row = db.get(`SELECT * FROM proxyPools WHERE id = ?`, [id]);
  if (!row) return null;
  return { ...JSON.parse(row.data || "{}"), id: row.id, isActive: !!row.isActive, testStatus: row.testStatus, createdAt: row.createdAt, updatedAt: row.updatedAt };
}

export async function createProxyPool(payload) {
  const db = await getAdapter();
  const now = new Date().toISOString();
  db.run(`INSERT INTO proxyPools(isActive, testStatus, data, createdAt, updatedAt) VALUES(?, ?, ?, ?, ?)`, [payload.isActive === false ? 0 : 1, payload.testStatus || "unknown", JSON.stringify(payload.data || {}), now, now]);
  return payload;
}

export async function updateProxyPool(id, changes) {
  const db = await getAdapter();
  const row = db.get(`SELECT data FROM proxyPools WHERE id = ?`, [id]);
  const current = row ? JSON.parse(row.data || "{}") : {};
  const { data: _d, ...rest } = changes;
  const merged = { ...current, ...rest };
  const fields = [];
  const vals = [];
  for (const [k, v] of Object.entries(changes)) {
    if (k === "data") continue;
    fields.push(`${k} = ?`);
    vals.push(v);
  }
  fields.push(`data = ?`);
  vals.push(JSON.stringify(merged));
  vals.push(id);
  db.run(`UPDATE proxyPools SET ${fields.join(", ")} WHERE id = ?`, vals);
}

export async function deleteProxyPool(id) {
  const db = await getAdapter();
  db.run(`DELETE FROM proxyPools WHERE id = ?`, [id]);
}
