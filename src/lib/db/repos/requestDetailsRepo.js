import { getAdapter } from "../driver.js";

export async function saveRequestDetail(row) {
  const db = await getAdapter();
  db.run(`INSERT INTO requestDetails(provider, model, connectionId, request, response, status, latency, tokens, pxpipe, createdAt) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.provider, row.model, row.connectionId, JSON.stringify(row.request || {}), JSON.stringify(row.response || {}), String(row.status || "unknown"), row.latency || 0, JSON.stringify(row.tokens || {}), JSON.stringify(row.pxpipe || {}), new Date().toISOString()]);
}

export async function getRequestDetails(limit = 100) {
  const db = await getAdapter();
  return db.all(`SELECT * FROM requestDetails ORDER BY createdAt DESC LIMIT ?`, [limit]).map(r => ({ ...r, request: JSON.parse(r.request || "{}"), response: JSON.parse(r.response || "{}"), tokens: JSON.parse(r.tokens || "{}"), pxpipe: JSON.parse(r.pxpipe || "{}") }));
}

export async function getRequestDetailById(id) {
  const db = await getAdapter();
  const row = db.get(`SELECT * FROM requestDetails WHERE id = ?`, [id]);
  if (!row) return null;
  return { ...row, request: JSON.parse(row.request || "{}"), response: JSON.parse(row.response || "{}"), tokens: JSON.parse(row.tokens || "{}"), pxpipe: JSON.parse(row.pxpipe || "{}") };
}

export async function getDistinctProviders() {
  const db = await getAdapter();
  return db.all(`SELECT DISTINCT provider FROM requestDetails WHERE provider IS NOT NULL AND provider != ''`).map(r => r.provider);
}
