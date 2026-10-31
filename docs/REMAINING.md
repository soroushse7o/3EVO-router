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
- [x] S6: Bind Hono to 127.0.0.1; strict CORS allowlist
- [x] S7: Scrub upstream errors before returning to client
- [x] S8/S9: Atomic writes via tmp+rename; no plaintext password in bootstrap.log
- [x] S11: Progressive lockout after failed auth attempts
- [x] S12: MITM routes gated behind EXPERIMENTAL_MITM=1
- [x] S13/S14: validateSession on every protected route
- [x] S15: Expanded scrubber patterns + logger.ts wired into /v1 routes
- [ ] S10: Provider URL allowlist + private-range blocklist + DNS rebind check

### Phase 2 — Real Routing Core 🔄 IN PROGRESS
- [x] R1: Timeouts via AbortSignal; network error fallback
- [x] R2: Windowed circuit breaker (5min) + single half-open probe
- [x] R3: Circuit key per provider/account tier
- [x] R4: Account priority sort; empty-safe rotation
- [x] R5: 503 on exhaustion; OpenAI-format error bodies
- [ ] Proxy pools wired into outbound router
- [ ] Multi-tier failover tested end-to-end with mock upstream

### Phase 3 — Translator & Streaming ⏳ PENDING
- [ ] T1–T7: Tool calls, image handling, Gemini schema, placeholders, SSE events
- [ ] Wire translator into /v1/chat/completions and /v1/messages
- [ ] Propagate client disconnect via AbortSignal
- [ ] Mid-stream failover before first byte

### Phase 4 — Providers & OAuth ⏳ PENDING
- [ ] One real provider path (OpenAI-compatible API key)
- [ ] OAuth: real official flow or honest removal from UI
- [ ] Providers page: real Test button
- [ ] README warning about subscription token reuse

### Phase 5 — Usage, Quota, RTK ⏳ PENDING
- [ ] RTK preserve blank lines, no truncation, fail-open
- [ ] Record real provider/model from resolved combo
- [ ] Streaming summary row with real token counts
- [ ] SQL aggregates for usage/quota/cost; configurable limits
- [ ] Lazy DB init

### Phase 6 — UI, CLI, Tests, Packaging ⏳ PENDING
- [ ] Honest labels for Combos/Providers/CLI/Console
- [ ] i18n wired into dashboard pages or remove false claim
- [ ] CLI tools: real config generation for installed clients
- [ ] E2E tests with temp DATA_DIR and mock upstream
- [ ] Fix ports, dependencies, packaging

## Definition of Done
- [ ] Clean checkout builds and tests pass with no external services
- [ ] Integration test proves fallback, circuit, streaming, usage row, cancel on disconnect
- [ ] Official OpenAI/Anthropic SDKs work against mock upstream
- [ ] No plaintext secrets at rest or in logs/exports
- [ ] All items above checked with tests or honestly removed
- [ ] README matches reality; no inflated claims
