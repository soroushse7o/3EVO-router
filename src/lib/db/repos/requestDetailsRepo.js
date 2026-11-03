import { getAdapter } from "../driver.js";

export async function saveRequestDetail(detail) {
  const db = await getAdapter();
  db.run(`INSERT INTO request_details(id, ts, route, provider, model, ip, api_key_prefix, status, latency_ms, request_headers, request_body, response_headers, response_body, error) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [detail.id, detail.ts, detail.route, detail.provider, detail.model, detail.ip, detail.apiKeyPrefix, detail.status, detail.latencyMs, JSON.stringify(detail.requestHeaders || {}), JSON.stringify(detail.requestBody || {}), JSON.stringify(detail.responseHeaders || {}), JSON.stringify(detail.responseBody || {}), detail.error || null]);
}

export async function getRequestDetails(limit = 50) {
  const db = await getAdapter();
  const rows = db.all(`SELECT * FROM request_details ORDER BY ts DESC LIMIT ?`, [limit]);
  return rows.map(r => ({
    id: r.id, ts: r.ts, route: r.route, provider: r.provider, model: r.model,
    ip: r.ip, apiKeyPrefix: r.api_key_prefix, status: r.status, latencyMs: r.latency_ms,
    requestHeaders: r.request_headers ? JSON.parse(r.request_headers) : {},
    requestBody: r.request_body ? JSON.parse(r.request_body) : {},
    responseHeaders: r.response_headers ? JSON.parse(r.response_headers) : {},
    responseBody: r.response_body ? JSON.parse(r.response_body) : {},
    error: r.error
  }));
}

export async function getRequestDetail(id) {
  const db = await getAdapter();
  const r = db.get(`SELECT * FROM request_details WHERE id = ?`, [id]);
  if (!r) return null;
  return {
    id: r.id, ts: r.ts, route: r.route, provider: r.provider, model: r.model,
    ip: r.ip, apiKeyPrefix: r.api_key_prefix, status: r.status, latencyMs: r.latency_ms,
    requestHeaders: r.request_headers ? JSON.parse(r.request_headers) : {},
    requestBody: r.request_body ? JSON.parse(r.request_body) : {},
    responseHeaders: r.response_headers ? JSON.parse(r.response_headers) : {},
    responseBody: r.response_body ? JSON.parse(r.response_body) : {},
    error: r.error
  };
}
