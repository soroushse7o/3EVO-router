import { getAdapter } from "../driver.js";

export async function createProviderRow(name, base_url, api_key_enc, model, priceIn = 0, priceOut = 0) {
  const db = await getAdapter();
  const result = db.run(`INSERT INTO providers(name, base_url, api_key_enc, model, price_per_1k_in, price_per_1k_out, created) VALUES(?, ?, ?, ?, ?, ?, ?)`, [name, base_url, api_key_enc, model, priceIn, priceOut, Date.now()]);
  return result.lastInsertRowid;
}

export async function listProvidersRows() {
  const db = await getAdapter();
  return db.all(`SELECT * FROM providers ORDER BY created ASC`).map(r => ({ ...r }));
}

export async function getProviderById(id) {
  const db = await getAdapter();
  const row = db.get(`SELECT * FROM providers WHERE id = ?`, [id]);
  return row || null;
}

export async function updateProvider(id, changes) {
  const db = await getAdapter();
  const fields = [];
  const vals = [];
  for (const [k, v] of Object.entries(changes)) {
    fields.push(`${k} = ?`);
    vals.push(v);
  }
  vals.push(id);
  db.run(`UPDATE providers SET ${fields.join(", ")} WHERE id = ?`, vals);
}

export async function deleteProviderRow(id) {
  const db = await getAdapter();
  db.run(`DELETE FROM providers WHERE id = ?`, [id]);
}
