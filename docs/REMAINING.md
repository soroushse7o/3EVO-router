# 3EVO Router — Roadmap

## Phase A — Core proxy (v0.1) ✅
- [x] Provider failover with circuit breaker
- [x] `/v1/chat/completions`, `/v1/messages`, `/v1/responses`, `/v1/models`
- [x] SQLite storage with multi-adapter fallback
- [x] Vault encryption at rest
- [x] Dashboard login + API key management
- [x] Usage logging + metrics
- [x] SSRF guard + rate limiting
- [x] Structured logs + scrubber

## Phase B — Auth hardening (v0.1) ✅
- [x] Central auth guard with deny-by-default
- [x] Progressive login lockout
- [x] CLI token auth
- [x] Trusted peer headers
- [x] Repository pattern for all DB tables
- [x] Provider executor pattern

## Phase C — Settings & observability (v0.2) ✅
- [x] Settings management UI + repo
- [x] Instrumentation (request timing, provider/route stats)
- [x] Quota/budget limits per provider or global

## Phase D — Polish (v0.2)
- [ ] Packaged installer (Windows `.exe` / `.msi`, Homebrew, etc.)
- [x] Persian RTL polish in dashboard UI
- [x] Playwright E2E test scaffold: health, models auth, login page visibility

## Phase E — OAuth (post-v0.2)
- [ ] Optional OAuth via official vendor flows only
- [ ] Connection management for OAuth-backed providers

## Phase F — Advanced routing (post-v0.2)
- [ ] Model aliases and routing rules
- [ ] Per-model fallback chains
- [ ] Request details tab with headers/body
