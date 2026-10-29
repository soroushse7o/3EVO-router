type State = "closed" | "open" | "half-open";
const states = new Map<string, { state: State; failures: number; openedAt: number }>();
const THRESHOLD = 3;
const COOLDOWN = 30000;
export function recordFailure(key: string) {
  const s = states.get(key) || { state: "closed", failures: 0, openedAt: 0 };
  s.failures++;
  if (s.failures >= THRESHOLD) { s.state = "open"; s.openedAt = Date.now(); }
  states.set(key, s);
}
export function recordSuccess(key: string) {
  states.set(key, { state: "closed", failures: 0, openedAt: 0 });
}
export function isOpen(key: string): boolean {
  const s = states.get(key);
  if (!s || s.state === "closed") return false;
  if (s.state === "open" && Date.now() - s.openedAt > COOLDOWN) { s.state = "half-open"; states.set(key, s); return false; }
  return s.state === "open";
}
