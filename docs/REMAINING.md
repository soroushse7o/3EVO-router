# 3EVO Router — Remaining Work

## Current State (derived from README Verified Feature Status)

### Phase 0 — Baseline & Honesty ✅ COMPLETE
- [x] Honest README.md and README.fa.md with Working/Stub/Dead table
- [x] docs/PLAN.md with Phase 0-6 remediation plan
- [x] docs/DECISIONS.md with baseline decisions
- [x] Removed duplicate scripts (progress-check.*)
- [x] Removed hardcoded fallback bearer tokens from /v1/* routes

### Phase 1 — Security (S1–S15) ✅ MOSTLY COMPLETE
- [x] S1: Remove hardcoded fallback; LOCAL_MODEL_API_KEY required
- [x] S2: Fix accounts overwrite with upsert + regression test
- [x] S3: Rate limit only on failed auth; cache API key validation
- [x] S4/S5: Export allowlist; import path protection
- [x] S6: Bind to localhost; strict CORS allowlist
- [x] S7: Scrub upstream errors before returning to client
- [x] S8/S9: Atomic writes via tmp+rename; no plaintext password in bootstrap.log
- [x] S11: Progressive lockout after failed auth attempts
- [x] S12: MITM routes gated behind EXPERIMENTAL_MITM=1
- [x] S13/S14: validateSession on every protected route
- [x] S15: Expanded scrubber patterns + logger.ts wired into /v1 routes
- [ ] S10: Provider URL allowlist + private-range blocklist + DNS rebind check

### Phase 2 — Real Routing Core ✅ COMPLETE
- [x] R1: Timeouts via AbortSignal; network error fallback
- [x] R2: Windowed circuit breaker (5min) + single half-open probe
- [x] R3: Circuit key per provider/account tier
- [x] R4: Account priority sort; empty-safe rotation
- [x] R5: 503 on exhaustion; OpenAI-format error bodies
- [x] Proxy pools wired into outbound router
- [x] Multi-tier failover tested end-to-end with mock upstream

### Phase 3 — Translator & Streaming ✅ COMPLETE
- [x] T1–T7: Tool calls, image handling, Gemini schema, placeholders, SSE events
- [x] Wire translator into /v1/chat/completions and /v1/messages
- [x] Propagate client disconnect via AbortSignal
- [x] Mid-stream failover before first byte

### Phase 4 — Providers & OAuth ✅ COMPLETE
- [x] One real provider path (OpenAI-compatible API key)
- [x] OAuth: honest removal from UI (no simulated Connected)
- [x] Providers page: real Test button
- [x] README warning about subscription token reuse

### Phase 5 — Usage, Quota, RTK ✅ COMPLETE
- [x] RTK preserve blank lines, no truncation, fail-open
- [x] Record real provider/model from resolved combo
- [x] Streaming summary row with real token counts
- [x] SQL aggregates for usage/quota/cost; configurable limits
- [x] Lazy DB init

### Phase 6 — UI, CLI, Tests, Packaging 🔄 IN PROGRESS
- [x] Honest labels for Combos/Providers/CLI/Console
- [x] i18n README honest (UI stub, static panel.html working)
- [x] Settings: drop unused fields (lang, rtk)
- [x] CLI skeleton
- [ ] E2E tests with temp DATA_DIR and mock upstream
- [ ] Remove dead gateway code and unused dependencies (hono)
