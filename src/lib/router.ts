import { recordFailure, recordSuccess, isOpen, getRetryAfter } from "@/lib/circuit";
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
      throw e;
    }
  }
  const tried = tiers.map((_, i) => `${keyPrefix}:tier:${i}`).join(", ");
  const soonest = tiers.map((_, i) => ({ key: `${keyPrefix}:tier:${i}`, retryAfter: getRetryAfter(`${keyPrefix}:tier:${i}`) })).sort((a, b) => a.retryAfter - b.retryAfter)[0];
  const err = new Error(`all tiers exhausted. tried: [${tried}]. soonest reset: ${soonest.retryAfter}ms (${soonest.key})`);
  err.tried = tried;
  err.soonest = soonest;
  throw err;
}
