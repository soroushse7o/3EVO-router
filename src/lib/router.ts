import { recordFailure, recordSuccess, isOpen, getRetryAfter } from "@/lib/circuit";
import { getSortedAccounts, getAccountById } from "@/lib/accounts";
function rotateAccounts(accounts: string[], strategy: "round-robin" | "priority" = "round-robin", lastIndex: { current: number } = { current: -1 }): string[] {
  if (strategy === "priority") return accounts.slice().sort((a, b) => a.localeCompare(b));
  lastIndex.current = (lastIndex.current + 1) % accounts.length;
  return [accounts[lastIndex.current], ...accounts.slice(0, lastIndex.current), ...accounts.slice(lastIndex.current + 1)];
}
export { rotateAccounts };
export function createProxyTier(accountId: string, body: any, apiKey: string) {
  return async () => {
    const acc = getAccountById(accountId);
    if (!acc?.upstreamUrl) throw { status: 400, message: "no upstream for account" };
    const r = await fetch(acc.upstreamUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw { status: r.status, message: data.error?.message || data.error || "upstream error" };
    return data;
  };
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
      const result = await tiers[i]();
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

// Mid-stream failover: wrap a ReadableStream and restart from next tier on error
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
      const result = await tiers[i]();
      recordSuccess(key);
      return { stream: result.stream, tierIndex: i };
    } catch (e: any) {
      recordFailure(key);
      lastErr = e;
    }
  }
  throw lastErr || new Error("all tiers exhausted for streaming");
}
