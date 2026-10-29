export async function runWithFallback<T>(tiers: Array<() => Promise<T>>): Promise<T> {
  let lastErr: any;
  for (const tier of tiers) {
    try { return await tier(); } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("all tiers exhausted");
}
