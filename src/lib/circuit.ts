type State = "closed" | "open" | "half-open";
interface CircuitState { state: State; failures: number; openedAt: number; lastFailure: number; halfOpenProbing: boolean; }
const states = new Map<string, CircuitState>();
const THRESHOLD = 3;
const WINDOW = 5 * 60 * 1000; // 5 minutes
const COOLDOWN = 30000;
export function recordFailure(key: string) {
  const now = Date.now();
  const s = states.get(key) || { state: "closed", failures: 0, openedAt: 0, lastFailure: 0, halfOpenProbing: false } as CircuitState;
  if (now - s.lastFailure > WINDOW) { s.failures = 1; } else { s.failures++; }
  s.lastFailure = now;
  if (s.failures >= THRESHOLD) { s.state = "open"; s.openedAt = now; }
  states.set(key, s);
}
export function recordSuccess(key: string) {
  states.set(key, { state: "closed", failures: 0, openedAt: 0, lastFailure: 0, halfOpenProbing: false } as CircuitState);
}
export function isOpen(key: string): boolean {
  const now = Date.now();
  const s = states.get(key);
  if (!s || s.state === "closed") return false;
  if (s.state === "open" && now - s.openedAt > COOLDOWN) {
    s.state = "half-open";
    s.halfOpenProbing = false;
    states.set(key, s);
    return false;
  }
  if (s.state === "half-open") {
    if (s.halfOpenProbing) return true;
    s.halfOpenProbing = true;
    states.set(key, s);
    return false;
  }
  return true;
}
export function getRetryAfter(key: string): number {
  const s = states.get(key);
  if (!s || s.state !== "open") return 0;
  return Math.max(0, COOLDOWN - (Date.now() - s.openedAt));
}
