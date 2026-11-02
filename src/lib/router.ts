import { recordFailure, recordSuccess, isOpen, getRetryAfter } from "@/lib/circuit";
import { isSafeUrl } from "@/lib/ssrf";
import { listProviders } from "@/lib/db";
import { decrypt, masterKey } from "@/lib/vault";

function getProviderTier(provider: { id: number; name: string; base_url: string; api_key_enc: string; model: string }) {
  return async () => {
    const trimmed = provider.base_url.replace(/\/$/, "");
    if (!await isSafeUrl(trimmed)) throw { status: 400, message: "blocked url", type: "invalid_request_error" };
    const apiKey = decrypt(provider.api_key_enc, masterKey());
    const url = `${trimmed}/chat/completions`;
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: provider.model, messages: [{ role: "user", content: "ping" }], max_tokens: 1 }) });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      throw { status: r.status, message: data.error?.message || data.error || "upstream error", provider: provider.name };
    }
    return { data: await r.json(), provider: provider.name };
  };
}

export async function buildProviderTiers(body: any) {
  const providers = listProviders();
  if (!providers.length) return [];
  return providers.map((p) => getProviderTier(p));
}

export async function runWithFallback<T>(tiers: Array<() => Promise<T>>, keyPrefix = "default", timeoutMs = 30000): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < tiers.length; i++) {
    const key = `${keyPrefix}:tier:${i}`;
    if (isOpen(key)) {
      const ra = getRetryAfter(key);
      lastErr = new Error(`circuit open for ${key}, retry-after ${ra}ms`);
      continue;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const result = await tiers[i]();
      clearTimeout(timeoutId);
      recordSuccess(key);
      return result;
    } catch (e: any) {
      recordFailure(key);
      lastErr = e;
      const status = e?.status || e?.response?.status;
      const isNetwork = !status && (e?.name === "AbortError" || e?.code === "ECONNREFUSED" || e?.code === "ETIMEDOUT" || e?.code === "ENOTFOUND" || e?.code === "EAI_AGAIN" || e?.message?.includes("timeout") || e?.message?.includes("network"));
      const shouldFallback = (status && status >= 500) || status === 429 || status === 401 || isNetwork;
      if (shouldFallback && i < tiers.length - 1) continue;
      if (i === tiers.length - 1) break;
      throw e;
    }
  }
  const tried = tiers.map((_, i) => `${keyPrefix}:tier:${i}`).join(", ");
  const soonest = tiers.map((_, i) => ({ key: `${keyPrefix}:tier:${i}`, retryAfter: getRetryAfter(`${keyPrefix}:tier:${i}`) })).sort((a, b) => a.retryAfter - b.retryAfter)[0];
  const msg = `all tiers exhausted. tried: [${tried}]. soonest reset: ${soonest.retryAfter}ms (${soonest.key})`;
  const err = Object.assign(new Error(msg), { tried, soonest, lastErr }) as Error & { status?: number };
  if (err.status === undefined) err.status = 503;
  throw err;
}

export async function streamWithFallback<T>(
  tiers: Array<() => Promise<{ stream: ReadableStream; body?: any }>>,
  keyPrefix = "default"
): Promise<{ stream: ReadableStream; tierIndex: number }> {
  let lastErr: any;
  for (let i = 0; i < tiers.length; i++) {
    const key = `${keyPrefix}:tier:${i}`;
    if (isOpen(key)) {
      lastErr = new Error(`circuit open for ${key}`);
      continue;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const result = await tiers[i]();
      clearTimeout(timeoutId);
      return { stream: result.stream, tierIndex: i };
    } catch (e: any) {
      recordFailure(key);
      lastErr = e;
    }
  }
  throw lastErr || new Error("all tiers exhausted for streaming");
}
