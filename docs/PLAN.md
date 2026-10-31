# 3EVO Router — Execution Plan

## Current State (Honest Assessment)
- Build: green, 55/55 tests pass in `src/lib/__tests__/`.
- Security: S1–S15 complete. S1 removed hardcoded fallback; S2 fixed account overwrite; S3 rate-limit only on failure with cache; S4/S5 export allowlist; S6 localhost-only Hono; S7 scrub upstream errors; S8/S9 atomic writes, no plaintext password log; S10 TODO; S11 progressive lockout; S12 MITM gated; S13/S14 session validated everywhere; S15 scrubber patterns + logger wired.
- Auth: works, bootstrap auth.json created without plaintext log, chmod 0600/0700.
- Gateway: `/v1/*` routes proxy to local llama-server; no multi-tier, no real OAuth, no real failover.
- Dashboard: login works; static showcase shows all sections; Persian RTL fixed.
- Dead/stub areas: OAuth simulated, mid-stream failover unused, RTK always 0, adapters cosmetic, combos static, CLI tools placeholder, console log stub, Hono gateway duplicate unused.

## Phase 0: Baseline & Honesty
1. Keep `p1-evidence.txt` as raw baseline.
2. Remove any remaining hardcoded secrets from source.
3. Rewrite `README.md` and `README.fa.md` with honest Working/Stub/Dead table.
4. Delete duplicate scripts (B6).
5. Commit: `phase0: baseline and honest docs`

## Phase 1: Security (S1–S15) ✅ COMPLETE
- S1: Remove hardcoded fallback; fail fast if `LOCAL_MODEL_API_KEY` missing. ✅
- S2: Fix accounts overwrite with upsert + test. ✅
- S3: Rate limit only failed auth attempts, keyed by real IP; cache API key hashes; no scrypt on hot path. ✅
- S4/S5: Export excludes sessions/secrets; import allowlist. ✅
- S6: Bind Hono to 127.0.0.1 only; remove wildcard CORS. ✅
- S7: Never return raw upstream errors; scrub details. ✅
- S8/S9: Single DATA_DIR source; atomic session writes with expiry; fix bootstrap log behavior; chmod 0600/0700. ✅
- S10: Provider URL allowlist + private-range blocklist + DNS rebind check. TODO
- S11: Progressive lockout for dashboard auth. ✅
- S12: Gate MITM behind `EXPERIMENTAL_MITM=1`; never write fake PEMs. ✅
- S13/S14: Validate session on every protected route; never rely on cookie presence alone. ✅
- S15: Complete scrubber patterns and wire into logging. ✅
- Commits: `security: S2 fix...`, `security: S3...`, `security: S4/S5...`, `security: S6/S7/S8/S9/S11/S12/S15`

## Phase 2: Real Routing Core
- R1: Real timeouts via AbortSignal; fallback only on 429/5xx/401/timeout/network; 4xx no fallback.
- R2: Circuit breaker windowed failures; exactly one half-open probe.
- R3: Circuit key per provider/account, not per IP.
- R4: Persistent account state; priority sort; empty-safe rotation.
- R5: Error bodies per OpenAI/Anthropic format; 503 on exhaustion.
- C7: Delete Hono duplicate or make it the only gateway sharing router module.
- B7: Wire proxy pools into outbound fetch or remove from UI.
- Commit: `router: real fallback, circuit, timeouts`

## Phase 3: Translator & Streaming
- T1–T7: Fix tool calls, image handling, Gemini schema, placeholders, Anthropic SSE events.
- Wire translator into `/v1/chat/completions` and `/v1/messages`; stream end-to-end.
- Propagate client disconnect via AbortSignal.
- Failover only before first byte.
- Commit: `translator: fix T1-T7 and wire streaming`

## Phase 4: Providers & OAuth
- Implement one real provider path (OpenAI-compatible API key) against mock server.
- OAuth: real official flow or remove from UI; no simulated "Connected".
- Providers page: real Test button, real forms.
- C10: README warning about subscription token reuse.
- Commit: `providers: real API-key path and honest OAuth`

## Phase 5: Usage, Quota, RTK
- U1: RTK preserve blank lines, no truncation, fail-open.
- U2: Record real provider/model from resolved combo.
- U3: One summary row at stream end with real token counts.
- U4: SQL aggregates for usage/quota/cost; configurable limits.
- U5: Lazy DB init.
- Commit: `usage: fix RTK, quota, streaming accounting`

## Phase 6: UI, CLI, Tests, Packaging
- Combos/Providers/CLI/Console: functional or labeled "not implemented".
- C8: Wire i18n properly or remove false claim; RTL + bundled font.
- B5: Make settings used or drop unused fields.
- C9: Real CLI with compiled JS.
- B3/B4/B6: Fix ports, dependencies, E2E tests with temp DATA_DIR and mock server.
- Commit per area: `ui: honest labels` / `tests: e2e with mock upstream`

## Definition of Done
- Clean checkout builds and tests pass with no external services.
- Integration test proves fallback, circuit, streaming, usage row, cancel on disconnect.
- Official OpenAI/Anthropic SDKs work against mock upstream.
- No plaintext secrets at rest or in logs/exports.
- All C/S/R/T/U/B items fixed with tests or honestly removed.
- README matches reality; no inflated claims.
