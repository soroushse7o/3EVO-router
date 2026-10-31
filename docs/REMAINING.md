# 3EVO Router — Remaining Roadmap to 100%

## Current: ~90% complete

### Phase A — OAuth Flows (real)
- [x] OAuth start + callback (stub)
- [x] Accounts store (OAuth tokens, encrypted)
- [ ] Device-code flow for each OAuth provider
- [ ] Token refresh proactive + reactive on 401
- [ ] Show token status in providers drawer
- [ ] Mark verified:true in providers.json after live check

### Phase B — Translator (full) + streaming
- [x] OpenAI ↔ Anthropic basic
- [x] Gemini format conversion
- [x] Responses API support
- [ ] Ollama/Cursor/Kiro/Vertex/Antigravity adapters
- [x] Golden-file tests per pair
- [ ] Mid-stream failover

### Phase C — Routing & failover (integrated)
- [x] runWithFallback helper
- [x] /v1/chat/completions uses runWithFallback
- [x] Account rotation (round-robin/priority) per provider
- [x] Circuit breaker lib (threshold 3, cooldown 30s)
- [x] Circuit breaker wired into routing
- [ ] All-tiers-exhausted error body (list tried, soonest reset)
- [ ] Dashboard alert for exhausted tiers

### Phase D — Usage + Quota (DB-backed UI)
- [x] SQLite usage DB + APIs
- [x] Usage page + CSV export
- [x] Quota API + page with 5h rolling window
- [ ] RTK savings measurement recorded
- [ ] Cost per 1M native vs after RTK

### Phase E — Settings (full)
- [x] Settings page + API
- [x] Settings persisted to ~/.3evo/settings.json
- [ ] Cloud sync with timeout (no UI freeze)
- [ ] Data export/import (secrets excluded unless encrypted)

### Phase F — Proxy pools, CLI tools, console log (real)
- [x] Scaffold pages
- [ ] Proxy CRUD + health check + assignment + rotation
- [ ] CLI tools: detect installed clients, generate/apply config
- [x] Console log: SSE live stream with level filter + search + secret masking

### Phase G — MITM (full, opt-in)
- [x] Opt-in consent stub
- [ ] Consent screen + root cert generation (user installs)
- [ ] Per-host allowlist, one-click uninstall/revoke

### Phase H — Hardening & docs
- [x] Log scrubber + tests
- [x] Vitest (scrubber, rtk, security, router)
- [x] README EN+FA final
- [x] Security checklist pass
- [x] docs/CLIENTS.md
- [x] docs/ASSUMPTIONS.md
- [x] Rate limiting (5 attempts/min per IP)
- [x] CSRF tokens
- [x] SSRF protection
- [x] Strict CORS allowlist
- [ ] E2E smoke tests (Playwright)

### Phase I — Separate Gateway (Hono/Fastify)
- [x] Hono gateway scaffolded
- [ ] Gateway process management (PM2/systemd)
- [ ] Gateway + Next.js communication config
- [ ] Unified health endpoint

## Estimated remaining: ~10% (3–6 hours focused)
