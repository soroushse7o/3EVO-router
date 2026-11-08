import { getAdapter } from "../driver.js";

export async function getProviderConnections() {
  const db = await getAdapter();
  return db.all(`SELECT id, provider, authType, name, email, priority, isActive, data, createdAt, updatedAt FROM providerConnections ORDER BY priority ASC, createdAt ASC`).map(r => ({
    ...JSON.parse(r.data || "{}"),
    id: r.id, provider: r.provider, authType: r.authType, name: r.name, email: r.email, priority: r.priority, isActive: !!r.isActive, createdAt: r.createdAt, updatedAt: r.updatedAt
  }));
}

export async function getProviderConnectionById(id) {
  const db = await getAdapter();
  const row = db.get(`SELECT * FROM providerConnections WHERE id = ?`, [id]);
  if (!row) return null;
  return { ...JSON.parse(row.data || "{}"), id: row.id, provider: row.provider, authType: row.authType, name: row.name, email: row.email, priority: row.priority, isActive: !!row.isActive, createdAt: row.createdAt, updatedAt: row.updatedAt };
}

export async function createProviderConnection(payload) {
  const db = await getAdapter();
  const { id, provider, authType, name, email, priority, isActive, ...rest } = payload;
  const now = new Date().toISOString();
  db.run(`INSERT INTO providerConnections(id, provider, authType, name, email, priority, isActive, data, createdAt, updatedAt) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id || undefined, provider, authType || "apiKey", name || null, email || null, priority || null, isActive === false ? 0 : 1, JSON.stringify(rest || {}), now, now]);
  return payload;
}

export async function updateProviderConnection(id, changes) {
  const db = await getAdapter();
  const row = db.get(`SELECT data FROM providerConnections WHERE id = ?`, [id]);
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
  db.run(`UPDATE providerConnections SET ${fields.join(", ")} WHERE id = ?`, vals);
}

export async function deleteProviderConnection(id) {
  const db = await getAdapter();
  db.run(`DELETE FROM providerConnections WHERE id = ?`, [id]);
}

export async function deleteProviderConnectionsByProvider(provider) {
  const db = await getAdapter();
  db.run(`DELETE FROM providerConnections WHERE provider = ?`, [provider]);
}

export async function reorderProviderConnections(ids) {
  const db = await getAdapter();
  for (let i = 0; i < ids.length; i++) {
    db.run(`UPDATE providerConnections SET priority = ? WHERE id = ?`, [i, ids[i]]);
  }
}

export async function cleanupProviderConnections() {
  const db = await getAdapter();
  db.run(`DELETE FROM providerConnections WHERE data = '{}' OR data IS NULL`);
}
