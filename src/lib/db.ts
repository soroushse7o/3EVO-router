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

export function estimateCost(model: string, tokensIn: number, tokensOut: number, provider?: string): number {
  const db = getAdapterSync();
  let priceIn = 0;
  let priceOut = 0;
  if (provider) {
    const row = db.get(`SELECT price_per_1k_in, price_per_1k_out FROM providers WHERE name = ?`, [provider]) as any;
    if (row) {
      priceIn = row.price_per_1k_in || 0;
      priceOut = row.price_per_1k_out || 0;
    }
  }
  if (priceIn || priceOut) {
    return ((tokensIn * priceIn) + (tokensOut * priceOut)) / 1000;
  }
  if (model.startsWith("gpt-4") || model.includes("claude")) return ((tokensIn + tokensOut) / 1_000_000) * 3;
  return ((tokensIn + tokensOut) / 1_000_000) * 1;
}

export function createProvider(name: string, baseUrl: string, apiKey: string, model: string, priceIn = 0, priceOut = 0) {
  const { encrypt, masterKey } = require("@/lib/vault");
  const enc = encrypt(apiKey, masterKey());
  const db = getAdapterSync();
  db.run(`INSERT INTO providers (name, base_url, api_key_enc, model, price_per_1k_in, price_per_1k_out, created) VALUES (?, ?, ?, ?, ?, ?, ?)`, [name, baseUrl, enc, model, priceIn, priceOut, Date.now()]);
}

export function listProviders() {
  const db = getAdapterSync();
  return db.all(`SELECT id, name, base_url, model, price_per_1k_in, price_per_1k_out, created FROM providers ORDER BY created DESC`);
}

export function getProvider(id: number) {
  const db = getAdapterSync();
  return db.get(`SELECT id, name, base_url, api_key_enc, model, price_per_1k_in, price_per_1k_out, created FROM providers WHERE id = ?`, [id]);
}

export function deleteProvider(id: number) {
  const db = getAdapterSync();
  db.run(`DELETE FROM providers WHERE id = ?`, [id]);
}

export { validateApiKey, createApiKey, revokeApiKey, listApiKeys };

let ensuredPricing = false;
export function ensureProviderPricingColumns() {
  if (ensuredPricing) return;
  const db = getAdapterSync();
  const cols = db.all("PRAGMA table_info(providers)").map((c: any) => c.name);
  if (!cols.includes("price_per_1k_in")) db.run("ALTER TABLE providers ADD COLUMN price_per_1k_in REAL DEFAULT 0");
  if (!cols.includes("price_per_1k_out")) db.run("ALTER TABLE providers ADD COLUMN price_per_1k_out REAL DEFAULT 0");
  ensuredPricing = true;
}
