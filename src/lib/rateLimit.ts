const store = new Map<string, { tokens: number; ts: number }>();
const WINDOW_MS = 60_000;
const MAX_TOKENS = 120;

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now - entry.ts > WINDOW_MS) {
    store.set(key, { tokens: 1, ts: now });
    return true;
  }
  entry.tokens += 1;
  return entry.tokens <= MAX_TOKENS;
}
