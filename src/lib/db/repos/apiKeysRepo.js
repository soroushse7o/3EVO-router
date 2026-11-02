import { getAdapter } from "../driver.js";

export async function getApiKeys() {
  const db = await getAdapter();
  return db.all(`SELECT id, key, name, machineId, isActive, createdAt FROM apiKeys ORDER BY createdAt DESC`).map(r => ({
    id: r.id, key: r.key, name: r.name, machineId: r.machineId, isActive: !!r.isActive, created: r.createdAt
  }));
}

export async function getApiKeyById(id) {
  const db = await getAdapter();
  const row = db.get(`SELECT * FROM apiKeys WHERE id = ?`, [id]);
  return row || null;
}

export async function getApiKeyByKey(key) {
  const db = await getAdapter();
  return db.get(`SELECT * FROM apiKeys WHERE key = ?`, [key]) || null;
}

export async function createApiKey(payload) {
  const db = await getAdapter();
  const now = new Date().toISOString();
  const result = db.run(`INSERT INTO apiKeys(key, name, machineId, isActive, createdAt) VALUES(?, ?, ?, 1, ?)`, [payload.key, payload.name || null, payload.machineId || null, now]);
  return { id: result.lastInsertRowid, ...payload, isActive: true, created: now };
}

export async function updateApiKey(id, changes) {
  const db = await getAdapter();
  const fields = [];
  const vals = [];
  for (const [k, v] of Object.entries(changes)) {
    fields.push(`${k} = ?`);
    vals.push(v);
  }
  vals.push(id);
  db.run(`UPDATE apiKeys SET ${fields.join(", ")} WHERE id = ?`, vals);
}

export async function revokeApiKey(id) {
  const db = await getAdapter();
  db.run(`UPDATE apiKeys SET revoked = 1 WHERE id = ?`, [id]);
}

export async function listApiKeys() {
  const db = await getAdapter();
  return db.all(`SELECT id, key, name, machineId, isActive, revoked, createdAt FROM apiKeys ORDER BY createdAt DESC`).map(r => ({ id: r.id, key: r.key, name: r.name, machineId: r.machineId, isActive: !!r.isActive, revoked: !!r.revoked, created: r.createdAt }));
}

export async function deleteApiKey(id) {
  const db = await getAdapter();
  db.run(`DELETE FROM apiKeys WHERE id = ?`, [id]);
}

export async function validateApiKey(key) {
  if (!key) return false;
  const db = await getAdapter();
  const row = db.get(`SELECT id FROM apiKeys WHERE key = ? AND isActive = 1 AND (revoked IS NULL OR revoked = 0)`, [key]);
  return !!row;
}
