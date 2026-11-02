import { getAdapter, getAdapterSync } from "@/lib/db/driver";
import { saveRequestUsage, getUsageHistory, getUsageStats } from "@/lib/db/repos/usageRepo.js";
import { getApiKeys, validateApiKey, createApiKey, revokeApiKey, listApiKeys } from "@/lib/db/repos/apiKeysRepo.js";

export { getAdapter, getAdapterSync };

// Back-compat sync accessor
export function getDb() {
  return getAdapterSync();
}

export function recordUsage(provider: string, model: string, tin: number, tout: number, saved: number) {
  saveRequestUsage({ provider, model, tokens_in: tin, tokens_out: tout, rtk_saved: saved });
}

export function getUsage() {
  return getUsageHistory(100);
}

export function getUsageAggregates() {
  return getUsageStats();
}

export function setQuota(provider: string, model: string, limitIn: number, limitOut: number) {
  const db = getAdapterSync();
  db.run(`INSERT OR REPLACE INTO quota (provider, model, limit_in, limit_out) VALUES (?,?,?,?)`, [provider, model, limitIn, limitOut]);
}

export function getQuota() {
  const db = getAdapterSync();
  return db.all(`SELECT * FROM quota`);
}

export function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  if (model.startsWith("gpt-4") || model.includes("claude")) return ((tokensIn + tokensOut) / 1_000_000) * 3;
  return ((tokensIn + tokensOut) / 1_000_000) * 1;
}

export function createProvider(name: string, baseUrl: string, apiKey: string, model: string) {
  const { encrypt, masterKey } = require("@/lib/vault");
  const enc = encrypt(apiKey, masterKey());
  const db = getAdapterSync();
  db.run(`INSERT INTO providers (name, base_url, api_key_enc, model, created) VALUES (?, ?, ?, ?, ?)`, [name, baseUrl, enc, model, Date.now()]);
}

export function listProviders() {
  const db = getAdapterSync();
  return db.all(`SELECT id, name, base_url, model, created FROM providers ORDER BY created DESC`);
}

export function getProvider(id: number) {
  const db = getAdapterSync();
  return db.get(`SELECT id, name, base_url, api_key_enc, model, created FROM providers WHERE id = ?`, [id]);
}

export function deleteProvider(id: number) {
  const db = getAdapterSync();
  db.run(`DELETE FROM providers WHERE id = ?`, [id]);
}

export { validateApiKey, createApiKey, revokeApiKey, listApiKeys };
