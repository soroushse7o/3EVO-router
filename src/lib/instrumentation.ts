type ProviderStats = { requests: number; errors: number; totalMs: number };
type RouteStats = { requests: number; errors: number; totalMs: number };

const providerStats = new Map<string, ProviderStats>();
const routeStats = new Map<string, RouteStats>();

export function recordProviderRequest(provider: string, durationMs: number, error?: boolean) {
  const s = providerStats.get(provider) || { requests: 0, errors: 0, totalMs: 0 };
  s.requests += 1;
  s.totalMs += durationMs;
  if (error) s.errors += 1;
  providerStats.set(provider, s);
}

export function recordRouteRequest(pathname: string, durationMs: number, error?: boolean) {
  const s = routeStats.get(pathname) || { requests: 0, errors: 0, totalMs: 0 };
  s.requests += 1;
  s.totalMs += durationMs;
  if (error) s.errors += 1;
  routeStats.set(pathname, s);
}

export function getProviderStats() {
  return Array.from(providerStats.entries()).map(([provider, s]) => ({
    provider,
    requests: s.requests,
    errors: s.errors,
    avgMs: s.requests ? Math.round(s.totalMs / s.requests) : 0,
    errorRate: s.requests ? (s.errors / s.requests) : 0,
  }));
}

export function getRouteStats() {
  return Array.from(routeStats.entries()).map(([route, s]) => ({
    route,
    requests: s.requests,
    errors: s.errors,
    avgMs: s.requests ? Math.round(s.totalMs / s.requests) : 0,
  }));
}

export function resetStats() {
  providerStats.clear();
  routeStats.clear();
}
