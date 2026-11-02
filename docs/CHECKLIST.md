# 3EVO Router — v0.1 Build Checklist

P0 = must-have for demo; P1 = beta hardening; P2 = post-launch.
Checklist status is derived from the actual codebase, not estimates.

## P0 — Launch blockers

- [x] P0-1 Clean-clone status recorded in `docs/STATUS.md`; false status docs deleted.
- [x] P0-2 `src/lib/paths.ts` added; all `os.homedir()` replaced with `DATA_DIR`.
- [ ] P0-3 API key create/list/revoke in SQLite + UI + `/v1/models` works end-to-end.
- [x] P0-4 Login form posts JSON; `Secure` cookie flag on HTTPS.
- [x] P0-10 Simulated routes/pages removed from nav and filesystem.
- [ ] P0-11 Provider keys encrypted at rest via vault; no plaintext secrets in `DATA_DIR`.
- [ ] P0-12 Legal/provenance note added (`docs/LEGAL.md`).

## P1 — Required for usable beta

- [ ] P1-1 GitHub Actions CI (install, typecheck, test, build).
- [ ] P1-2 Dockerfile with `DATA_DIR` volume, healthcheck, non-root user.
- [ ] P1-3 `/v1/messages` translator + streaming + golden tests.
- [ ] P1-4 Usage page backed by SQL aggregates.
- [ ] P1-5 UX pass: onboarding checklist, empty states, error toasts, keyboard/contrast.
- [ ] P1-6 Structured logs with request IDs + log-leak test.
- [ ] P1-7 Rewritten README + `docs/ARCHITECTURE.md` + client setup guide.
- [ ] P1-8 Dependency/license audit + Node `engines` pin.

## P2 — After launch

- [ ] Persian/RTL UI.
- [ ] Quota/budget limits.
- [ ] `/v1/responses`.
- [ ] Per-key rate limits.
- [ ] Optional OAuth only via official vendor-sanctioned flows.
- [ ] Metrics endpoint.
- [ ] Packaged installer.

## Section 8 must-have tests

- [ ] Auth: login, expiry, per-IP backoff, reset flow, key create/revoke.
- [ ] Failover table: 200, 429→next, 500→next, timeout→next, 400 passthrough, all-fail→503.
- [ ] Circuit: opens after N failures, exactly one half-open probe, closes on success, per-provider.
- [ ] Streaming: byte-for-byte SSE passthrough, mid-stream error event, client abort cancels upstream, one usage row.
- [ ] OpenAI + Anthropic SDK compatibility against mock upstream.
- [ ] Security: SSRF matrix, no plaintext secrets on disk, export contains none, log scrubber.
- [ ] Playwright on port 20128 with login fixture: onboarding to first successful call.
