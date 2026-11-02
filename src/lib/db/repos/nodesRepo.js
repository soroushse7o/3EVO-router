import { getAdapter } from "../driver.js";

export async function getProviderNodes() {
  const db = await getAdapter();
  return db.all(`SELECT id, type, name, data, createdAt, updatedAt FROM providerNodes`).map(r => ({ ...JSON.parse(r.data || "{}"), id: r.id, type: r.type, name: r.name, createdAt: r.createdAt, updatedAt: r.updatedAt }));
}

export async function getProviderNodeById(id) {
  const db = await getAdapter();
  const row = db.get(`SELECT * FROM providerNodes WHERE id = ?`, [id]);
  if (!row) return null;
  return { ...JSON.parse(row.data || "{}"), id: row.id, type: row.type, name: row.name, createdAt: row.createdAt, updatedAt: row.updatedAt };
}

export async function createProviderNode(payload) {
  const db = await getAdapter();
  const now = new Date().toISOString();
  db.run(`INSERT INTO providerNodes(type, name, data, createdAt, updatedAt) VALUES(?, ?, ?, ?, ?)`, [payload.type || null, payload.name || null, JSON.stringify(payload.data || {}), now, now]);
  return payload;
}

export async function updateProviderNode(id, changes) {
  const db = await getAdapter();
  const row = db.get(`SELECT data FROM providerNodes WHERE id = ?`, [id]);
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
  db.run(`UPDATE providerNodes SET ${fields.join(", ")} WHERE id = ?`, vals);
}

export async function deleteProviderNode(id) {
  const db = await getAdapter();
  db.run(`DELETE FROM providerNodes WHERE id = ?`, [id]);
}
