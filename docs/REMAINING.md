# 3EVO Router — Remaining Work

## Phase E — OAuth
- [x] Google/GitHub OAuth flows
- [x] Refresh token auto-renewal
- [x] `/api/oauth` endpoints
- [x] `/api/oauth/connections/[id]` endpoints
- [x] OAuth connection management UI

## Phase F — Advanced routing
- [x] Provider failover with circuit breaker
- [x] Model alias routing
- [x] Streaming SSE passthrough
- [x] Request/response detail logging
- [x] Per-provider metrics in `/api/metrics`
- [ ] Rule-based routing (header/token-based)
- [ ] Retry budgets per endpoint

## Phase G — Packaging & distribution
- [x] Docker multi-stage build (`output: standalone`)
- [x] `.dockerignore`
- [x] `pkg` binaries for Windows/macOS/Linux
- [x] Encrypted backup/restore utility
- [x] Prometheus metrics exporter
- [x] Windows installer (NSIS script ready)
- [x] Linux `.deb` / `.rpm` packages (scripts ready)

## Phase H — Production hardening
- [x] Rate-limit burst shaping per IP
- [x] Grafana dashboard template
- [x] Security audit & dependency scan automation
- [x] Encrypted backup/restore for `~/.3evo`
- [x] Prometheus metrics exporter (`/api/metrics/prometheus`)

## Not planned
- ~~macOS `.dmg` / Homebrew tap~~
