import { getAdapter } from "../driver.js";

export async function getDisabledModels() {
  const db = await getAdapter();
  return db.all(`SELECT id, provider, model, reason, createdAt FROM disabledModels`);
}

export async function getDisabledByProvider(provider) {
  const db = await getAdapter();
  return db.all(`SELECT model, reason FROM disabledModels WHERE provider = ?`, [provider]);
}

export async function disableModels(provider, models, reason) {
  const db = await getAdapter();
  const now = new Date().toISOString();
  for (const model of models) {
    db.run(`INSERT OR REPLACE INTO disabledModels(provider, model, reason, createdAt) VALUES(?, ?, ?, ?)`, [provider, model, reason || "manual", now]);
  }
}

export async function enableModels(provider, models) {
  const db = await getAdapter();
  for (const model of models) {
    db.run(`DELETE FROM disabledModels WHERE provider = ? AND model = ?`, [provider, model]);
  }
}
