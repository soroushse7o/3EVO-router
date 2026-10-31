import { recordFailure, recordSuccess, isOpen, getRetryAfter } from "@/lib/circuit";
function rotateAccounts(accounts: string[], strategy: "round-robin" | "priority" = "round-robin", lastIndex: { current: number } = { current: -1 }): string[] {
  if (strategy === "priority") return accounts.slice().sort((a, b) => a.localeCompare(b));
  lastIndex.current = (lastIndex.current + 1) % accounts.length;
  return [accounts[lastIndex.current], ...accounts.slice(0, lastIndex.current), ...accounts.slice(lastIndex.current + 1)];
}
export { rotateAccounts };
export async function runWithFallback<T>(tiers: Array<() => Promise<T>>, keyPrefix = "default"): Promise<T> {
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
      if (status && status >= 500 && status < 600 && i < tiers.length - 1) continue;
      if (status === 429 && i < tiers.length - 1) continue;
      if (status === 401 && i < tiers.length - 1) continue;
      if (i === tiers.length - 1) break;
      throw e;
    }
  }
  const tried = tiers.map((_, i) => `${keyPrefix}:tier:${i}`).join(", ");
  const soonest = tiers.map((_, i) => ({ key: `${keyPrefix}:tier:${i}`, retryAfter: getRetryAfter(`${keyPrefix}:tier:${i}`) })).sort((a, b) => a.retryAfter - b.retryAfter)[0];
  const err = Object.assign(new Error(`all tiers exhausted. tried: [${tried}]. soonest reset: ${soonest.retryAfter}ms (${soonest.key})`), { tried, soonest, lastErr });
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
