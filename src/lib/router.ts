import { recordFailure, recordSuccess, isOpen, getRetryAfter } from "@/lib/circuit";
import { isSafeUrl } from "@/lib/ssrf";
import { listProvidersRows } from "@/lib/db/repos/providersRepo.js";
import { getAlias } from "@/lib/db/repos/aliasesRepo.js";
import { decrypt, masterKey } from "@/lib/vault";
import { createStreamController } from "@/lib/streamController.js";
import { DefaultExecutor, ProviderResult } from "@/lib/providers/DefaultExecutor";

interface ProviderRow { id: number; name: string; base_url: string; api_key_enc: string; model: string; }

export async function buildProviderTiers(body: any, signal?: AbortSignal) {
  const model = body.model || "unknown";
  const alias = await getAlias(model);
  let targetModel = model;
  let fallbackChain: string[] = [];
  
  if (alias) {
    targetModel = alias.model;
    fallbackChain = alias.fallback || [];
  }

  const providers = await listProvidersRows() as ProviderRow[];
  if (!providers.length) return { nonStream: [], stream: [] as Array<() => Promise<{ stream: ReadableStream; provider: string }>> };

  const primary = providers.filter(p => p.model === targetModel);
  const fallbackProviders = fallbackChain.flatMap(fbAlias => 
    providers.filter(p => p.name === fbAlias || p.model === fbAlias)
  );

  const usedNames = new Set([...primary, ...fallbackProviders].map(p => p.name));
  const remaining = providers.filter(p => !usedNames.has(p.name));

  const ordered = [...primary, ...fallbackProviders, ...remaining];
  if (!ordered.length) return { nonStream: [], stream: [] };

  const nonStream = ordered.map((p) => async () => {
    const trimmed = p.base_url.replace(/\/$/, "");
    if (!isSafeUrl(trimmed)) throw { status: 400, message: "blocked url" };
    const apiKey = decrypt(p.api_key_enc, masterKey());
    const executor = new DefaultExecutor({ name: p.name, baseUrl: trimmed, apiKey, model: p.model });
    return await executor.fetchJson("/chat/completions", { model: p.model, messages: [{ role: "user", content: "ping" }], max_tokens: 1 });
  });

  const stream = ordered.map((p) => () => {
    const trimmed = p.base_url.replace(/\/$/, "");
    if (!isSafeUrl(trimmed)) throw { status: 400, message: "blocked url" };
    const apiKey = decrypt(p.api_key_enc, masterKey());
    const executor = new DefaultExecutor({ name: p.name, baseUrl: trimmed, apiKey, model: p.model });
    return executor.stream("/chat/completions", body, signal);
  });

  return { nonStream, stream };
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
