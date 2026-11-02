import { recordFailure, recordSuccess, isOpen, getRetryAfter } from "@/lib/circuit";
import { isSafeUrl } from "@/lib/ssrf";
import { listProviders } from "@/lib/db";
import { decrypt, masterKey } from "@/lib/vault";
import { createStreamController } from "@/lib/streamController.js";

interface ProviderRow { id: number; name: string; base_url: string; api_key_enc: string; model: string; }

function getProviderTier(provider: ProviderRow) {
  return async () => {
    const trimmed = provider.base_url.replace(/\/$/, "");
    if (!await isSafeUrl(trimmed)) throw { status: 400, message: "blocked url" };
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

function getProviderStreamTier(provider: ProviderRow, body: any, signal?: AbortSignal) {
  return async () => {
    const trimmed = provider.base_url.replace(/\/$/, "");
    if (!await isSafeUrl(trimmed)) throw { status: 400, message: "blocked url" };
    const apiKey = decrypt(provider.api_key_enc, masterKey());
    const url = `${trimmed}/chat/completions`;
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ ...body, stream: true }), signal });
    if (!r.ok) {
      const err = await r.text().catch(() => ({}));
      throw { status: r.status, message: err || "upstream error" };
    }
    if (!r.body) throw { status: 502, message: "upstream closed body" };
    return { stream: r.body, provider: provider.name };
  };
}

export async function buildProviderTiers(body: any, signal?: AbortSignal) {
  const providers = listProviders() as ProviderRow[];
  if (!providers.length) return { nonStream: [], stream: [] as Array<() => Promise<{ stream: ReadableStream; provider: string }>> };
  return {
    nonStream: providers.map(p => getProviderTier(p)),
    stream: providers.map(p => getProviderStreamTier(p, body, signal)),
  };
}

export async function runWithFallback<T>(tiers: Array<() => Promise<T>>, keyPrefix: string, timeoutMs = 30000): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < tiers.length; i++) {
    const key = `${keyPrefix}:provider:${i}`;
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
      const shouldFallback = (status && status >= 500) || status === 429 || isNetwork;
      if (shouldFallback && i < tiers.length - 1) continue;
      if (i === tiers.length - 1) break;
      throw e;
    }
  }
  const tried = tiers.map((_, i) => `${keyPrefix}:provider:${i}`).join(", ");
  const soonest = tiers.map((_, i) => ({ key: `${keyPrefix}:provider:${i}`, retryAfter: getRetryAfter(`${keyPrefix}:provider:${i}`) })).sort((a, b) => a.retryAfter - b.retryAfter)[0];
  const msg = `all tiers exhausted. tried: [${tried}]. soonest reset: ${soonest.retryAfter}ms (${soonest.key})`;
  const err = Object.assign(new Error(msg), { tried, soonest, lastErr }) as any;
  err.status = 503;
  throw err;
}

export async function streamWithFallback(
  tiers: Array<() => Promise<{ stream: ReadableStream; provider: string }>>,
  keyPrefix: string
): Promise<{ stream: ReadableStream; provider: string }> {
  let lastErr: any;
  for (let i = 0; i < tiers.length; i++) {
    const key = `${keyPrefix}:provider:${i}`;
    if (isOpen(key)) {
      lastErr = new Error(`circuit open for ${key}`);
      continue;
    }
    try {
      const streamCtrl = createStreamController({
        onDisconnect: (reason: string) => console.log(`[STREAM] ${key} ended: ${reason}`),
        onError: () => {},
        provider: keyPrefix,
        model: "stream",
      });
      const result = await tiers[i]();
      recordSuccess(key);
      return { stream: result.stream, provider: result.provider };
    } catch (e: any) {
      recordFailure(key);
      lastErr = e;
    }
  }
  throw lastErr || new Error("all tiers exhausted for streaming");
}
