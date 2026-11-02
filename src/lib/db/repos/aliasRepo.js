import { getAdapter } from "../driver.js";

export async function getModelAliases() {
  const db = await getAdapter();
  const rows = db.all(`SELECT key, value FROM kv WHERE scope = 'modelAliases'`);
  const out = {};
  for (const r of rows) out[r.key] = JSON.parse(r.value || "{}");
  return out;
}

export async function setModelAlias(alias, value) {
  const db = await getAdapter();
  db.run(`INSERT INTO kv(scope, key, value) VALUES('modelAliases', ?, ?) ON CONFLICT(scope, key) DO UPDATE SET value = excluded.value`, [alias, JSON.stringify(value)]);
}

export async function deleteModelAlias(alias) {
  const db = await getAdapter();
  db.run(`DELETE FROM kv WHERE scope = 'modelAliases' AND key = ?`, [alias]);
}

export async function getCustomModels() {
  const db = await getAdapter();
  return db.all(`SELECT value FROM kv WHERE scope = 'customModels'`).map(r => JSON.parse(r.value || "{}"));
}

export async function addCustomModel(model) {
  const db = await getAdapter();
  db.run(`INSERT INTO kv(scope, key, value) VALUES('customModels', ?, ?)`, [model.id, JSON.stringify(model)]);
}

export async function deleteCustomModel(id) {
  const db = await getAdapter();
  db.run(`DELETE FROM kv WHERE scope = 'customModels' AND key = ?`, [id]);
}

export async function getMitmAlias() {
  const db = await getAdapter();
  const rows = db.all(`SELECT key, value FROM kv WHERE scope = 'mitmAlias'`);
  const out = {};
  for (const r of rows) out[r.key] = JSON.parse(r.value || "{}");
  return out;
}

export async function setMitmAliasAll(value) {
  const db = await getAdapter();
  db.run(`DELETE FROM kv WHERE scope = 'mitmAlias'`);
  if (value && Object.keys(value).length) {
    for (const [k, v] of Object.entries(value)) db.run(`INSERT INTO kv(scope, key, value) VALUES('mitmAlias', ?, ?)`, [k, JSON.stringify(v)]);
  }
}

export async function getPricing() {
  const db = await getAdapter();
  const rows = db.all(`SELECT key, value FROM kv WHERE scope = 'pricing'`);
  const out = {};
  for (const r of rows) out[r.key] = JSON.parse(r.value || "{}");
  return out;
}

export async function getPricingForModel(model) {
  const all = await getPricing();
  return all[model] || null;
}

export async function updatePricing(model, data) {
  const db = await getAdapter();
  db.run(`INSERT INTO kv(scope, key, value) VALUES('pricing', ?, ?) ON CONFLICT(scope, key) DO UPDATE SET value = excluded.value`, [model, JSON.stringify(data)]);
}

export async function resetPricing(model) {
  const db = await getAdapter();
  db.run(`DELETE FROM kv WHERE scope = 'pricing' AND key = ?`, [model]);
}

export async function resetAllPricing() {
  const db = await getAdapter();
  db.run(`DELETE FROM kv WHERE scope = 'pricing'`);
}
