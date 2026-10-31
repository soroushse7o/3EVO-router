const limits = new Map<string, { count: number; reset: number }>();

export function checkRateLimit(key: string, max: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const entry = limits.get(key);
  if (!entry || now > entry.reset) {
    limits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  entry.count++;
  if (entry.count > max) {
    return false;
  }
  return true;
}
