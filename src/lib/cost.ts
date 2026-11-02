export function estimateCost(model: string, tokensIn: number, tokensOut: number, provider?: string): number {
  // Provider-specific pricing takes precedence when available
  if (provider) {
    try {
      const { getAdapterSync } = require("@/lib/db");
      const db = getAdapterSync();
      const row = db.get(`SELECT price_per_1k_in, price_per_1k_out FROM providers WHERE name = ?`, [provider]) as any;
      if (row && (row.price_per_1k_in || row.price_per_1k_out)) {
        return ((tokensIn * (row.price_per_1k_in || 0)) + (tokensOut * (row.price_per_1k_out || 0))) / 1000;
      }
    } catch {}
  }
  const lower = model.toLowerCase();
  if (lower.includes("qwen") || lower.includes("llama") || lower.includes("local")) {
    return ((tokensIn + tokensOut) / 1_000_000) * 1;
  }
  return ((tokensIn + tokensOut) / 1_000_000) * 3;
}
