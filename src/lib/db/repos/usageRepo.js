import { getAdapter } from "../driver.js";

export async function getUsageHistory(limit = 100) {
  const db = await getAdapter();
  return db.all(`SELECT * FROM usage ORDER BY ts DESC LIMIT ?`, [limit]).map(r => ({
    id: r.id, ts: r.ts, provider: r.provider, model: r.model, tokens_in: r.tokens_in, tokens_out: r.tokens_out, rtk_saved: r.rtk_saved
  }));
}

export async function getUsageStats() {
  const db = await getAdapter();
  return db.all(`SELECT provider, model, sum(tokens_in) as tokens_in, sum(tokens_out) as tokens_out, count(*) as requests FROM usage GROUP BY provider, model`);
}

export async function saveRequestUsage(row) {
  const db = await getAdapter();
  db.run(`INSERT INTO usage(ts, provider, model, tokens_in, tokens_out, rtk_saved) VALUES(?, ?, ?, ?, ?, ?)`,
    [row.ts || Date.now(), row.provider, row.model, row.tokens_in || 0, row.tokens_out || 0, row.rtk_saved || 0]);
}
