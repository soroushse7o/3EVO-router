import { getAdapter } from "../driver.js";

export async function getCombos() {
  const db = await getAdapter();
  return db.all(`SELECT id, name, kind, models, createdAt, updatedAt FROM combos`).map(r => ({ id: r.id, name: r.name, kind: r.kind, models: JSON.parse(r.models || "[]"), createdAt: r.createdAt, updatedAt: r.updatedAt }));
}

export async function getComboById(id) {
  const db = await getAdapter();
  const row = db.get(`SELECT * FROM combos WHERE id = ?`, [id]);
  if (!row) return null;
  return { id: row.id, name: row.name, kind: row.kind, models: JSON.parse(row.models || "[]"), createdAt: row.createdAt, updatedAt: row.updatedAt };
}

export async function getComboByName(name) {
  const db = await getAdapter();
  const row = db.get(`SELECT * FROM combos WHERE name = ?`, [name]);
  if (!row) return null;
  return { id: row.id, name: row.name, kind: row.kind, models: JSON.parse(row.models || "[]"), createdAt: row.createdAt, updatedAt: row.updatedAt };
}

export async function createCombo(payload) {
  const db = await getAdapter();
  const now = new Date().toISOString();
  db.run(`INSERT INTO combos(name, kind, models, createdAt, updatedAt) VALUES(?, ?, ?, ?, ?)`, [payload.name, payload.kind || null, JSON.stringify(payload.models || []), now, now]);
  return payload;
}

export async function updateCombo(id, changes) {
  const db = await getAdapter();
  const fields = [];
  const vals = [];
  for (const [k, v] of Object.entries(changes)) {
    if (k === "models") {
      fields.push(`models = ?`);
      vals.push(JSON.stringify(v));
    } else {
      fields.push(`${k} = ?`);
      vals.push(v);
    }
  }
  vals.push(id);
  db.run(`UPDATE combos SET ${fields.join(", ")} WHERE id = ?`, vals);
}

export async function deleteCombo(id) {
  const db = await getAdapter();
  db.run(`DELETE FROM combos WHERE id = ?`, [id]);
}
