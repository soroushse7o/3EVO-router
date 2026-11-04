const store = new Map<string, { tokens: number; ts: number }>();
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_TOKENS = 120;

export interface RateLimitConfig {
  windowMs?: number;
  maxTokens?: number;
  keyPrefix?: string;
}

export function checkRateLimit(key: string, config: RateLimitConfig = {}): boolean {
  const { windowMs = DEFAULT_WINDOW_MS, maxTokens = DEFAULT_MAX_TOKENS, keyPrefix } = config;
  const bucketKey = keyPrefix ? `${keyPrefix}:${key}` : key;
  const now = Date.now();
  const entry = store.get(bucketKey);
  
  if (!entry || now - entry.ts > windowMs) {
    store.set(bucketKey, { tokens: 1, ts: now });
    return true;
  }
  
  entry.tokens += 1;
  return entry.tokens <= maxTokens;
}

export function getRateLimitStatus(key: string, config: RateLimitConfig = {}): { remaining: number; resetMs: number } {
  const { windowMs = DEFAULT_WINDOW_MS, maxTokens = DEFAULT_MAX_TOKENS, keyPrefix } = config;
  const bucketKey = keyPrefix ? `${keyPrefix}:${key}` : key;
  const now = Date.now();
  const entry = store.get(bucketKey);
  
  if (!entry || now - entry.ts > windowMs) {
    return { remaining: maxTokens, resetMs: 0 };
  }
  
  const remaining = Math.max(0, maxTokens - entry.tokens);
  const resetMs = Math.max(0, windowMs - (now - entry.ts));
  return { remaining, resetMs };
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}

export function createIpRateLimiter(options: { windowMs?: number; maxTokens?: number; burstMs?: number } = {}): (ip: string) => boolean {
  const { windowMs = DEFAULT_WINDOW_MS, maxTokens = DEFAULT_MAX_TOKENS, burstMs = 5_000 } = options;
  const burstMaxTokens = Math.ceil(maxTokens * 1.5);
  
  return (ip: string): boolean => {
    const now = Date.now();
    const entry = store.get(ip);
    
    if (!entry || now - entry.ts > windowMs) {
      store.set(ip, { tokens: 1, ts: now });
      return true;
    }
    
    entry.tokens += 1;
    
    // Burst shaping: allow higher rate for short bursts
    if (entry.tokens <= burstMaxTokens && (now - entry.ts) < burstMs) {
      return true;
    }
    
    return entry.tokens <= maxTokens;
  };
}

export function getIpRateLimitStatus(ip: string, options: { windowMs?: number; maxTokens?: number } = {}): { remaining: number; resetMs: number; burstRemaining: number } {
  const { windowMs = DEFAULT_WINDOW_MS, maxTokens = DEFAULT_MAX_TOKENS } = options;
  const now = Date.now();
  const entry = store.get(ip);
  
  if (!entry || now - entry.ts > windowMs) {
    return { remaining: maxTokens, resetMs: 0, burstRemaining: Math.ceil(maxTokens * 1.5) };
  }
  
  const remaining = Math.max(0, maxTokens - entry.tokens);
  const burstRemaining = Math.max(0, Math.ceil(maxTokens * 1.5) - entry.tokens);
  const resetMs = Math.max(0, windowMs - (now - entry.ts));
  
  return { remaining, resetMs, burstRemaining };
}

