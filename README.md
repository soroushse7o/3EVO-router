# 3EVO Router — Smart AI Gateway (Local + Web Dashboard)

One compatible endpoint for OpenAI/Anthropic. Automatically and intelligently routes requests across multiple providers with multi-account rotation, 3-tier fallback, and token compression (RTK).

> **Status: Alpha — not production-ready.** Many advertised features are stubs, simulations, or dead code. See [Verified Feature Status](#verified-feature-status) for the current state.

## Verified Feature Status

| Feature | Status | Evidence / File |
|---------|--------|-----------------|
| `/api/auth/route.ts` | Dashboard login (scrypt + session) | `src/lib/auth.ts`, `src/app/api/auth/route.ts` |
| `/api/auth/reset/route.ts` | Password reset (requires AUTH_RESET_TOKEN) | `src/app/api/auth/reset/route.ts` |
| `/v1/chat/completions` proxy | Working | `src/app/api/v1/chat/completions/route.ts` |
| `/v1/messages` proxy | Working | `src/app/api/v1/messages/route.ts` |
| `/v1/responses` proxy | Working | `src/app/api/v1/responses/route.ts` |
| `/v1/models` | Working | `src/app/api/v1/models/route.ts` |
| API key generation/validation | Working | `src/lib/api-key.ts` |
| Vault encrypt/decrypt | Working | `src/lib/vault.ts` |
| Scrubber (basic patterns) | Working | `src/lib/scrubber.ts` |
| Usage logging (SQLite) | Stub | `src/lib/db.ts`; records rows but aggregates are limited |
| Quota tracker | Stub | `src/app/api/quota/route.ts`; 5h window hardcoded |
| RTK token compression | Stub | `src/lib/rtk.ts`; always reports 0 savings |
| Circuit breaker | Stub | `src/lib/circuit.ts`; in-memory, no persistence |
| 3-tier failover | Stub | `src/lib/router.ts`; only one tier wired in `/v1/chat/completions` |
| Account rotation | Stub | `src/lib/router.ts`; no persistent account state |
| OAuth device-code flow | Simulated | `src/lib/oauth-flows.ts`; fabricates tokens |
| Provider adapters (Ollama/Cursor/etc.) | Cosmetic | `src/lib/translator.ts`; only changes model name |
| Combos page | Static UI | `src/app/(dashboard)/combos/page.tsx`; 3 hardcoded cards |
| Providers page | Static UI | `src/app/(dashboard)/providers/page.tsx` |
| Proxy pools CRUD | Working | `src/app/api/proxy-pools`; not used in outbound |
| MITM | Experimental | `src/app/api/mitm/*`; no real interception |
| CLI tools config generation | Stub | `src/app/(dashboard)/cli-tools/page.tsx` |
| Console log | Stub | `src/app/(dashboard)/console-log/page.tsx` |
| i18n EN/FA + RTL | Working | `src/lib/i18n.ts`, static `docs/panel.html` |
| Hono gateway server | Dead code | `src/gateway/index.ts`; not imported by any route |
| CORS/CSRF/SSRF/rate-limit | Partial | Present in some routes, inconsistent |

## Architecture

```
Client (OpenAI/Anthropic SDK)
        │
        ▼
  ┌─────────────┐
  │  Gateway    │  /v1/*  (Next.js API routes)
  │  Proxy      │  (Node.js runtime)
  └──────┬──────┘
         │
   ┌─────┴─────┐
   │  Router   │  runWithFallback, tiers, rotation, circuit breaker
   └─────┬─────┘
         │
   ┌─────┴─────────────────────┐
   │ Providers / Accounts      │  OAuth, API-key, compatible
   └─────┬─────────────────────┘
         │
   ┌─────┴─────┐
   │  RTK      │  tool_result compression
   └─────┬─────┘
         │
   ┌─────┴─────┐
   │  Vault    │  AES-256-GCM secrets (SQLite ~/.3evo)
   └───────────┘
```

- **Storage**: SQLite (`better-sqlite3`) at `~/.3evo/`.
- **Secrets**: AES-256-GCM, key from local file `~/.3evo/master.key`.
- **CLI**: `3evo-router --port 20128 [--daemon] [--no-rtk]`.

## Security (Current: Alpha)

- Default bind to `127.0.0.1` in scripts.
- Initial password randomly generated and shown once in terminal.
- Dashboard auth: cookie-based session with scrypt password hashing.
- Session validation in route handlers; proxy runs in Node.js runtime.
- Log scrubber: sensitive requests are scrubbed.
- Secrets stored encrypted in vault.
- CSRF token validation implemented.
- Rate limiting: 5 auth attempts/min, 10 API key attempts/min.
- SSRF protection: only localhost/127.0.0.1 allowed.
- Strict CORS allowlist configured.
- OS keychain integration planned for v2.

## Dashboard password

Set `ADMIN_PASSWORD` in `.env` before first run. If unset, a random password is generated and printed to the terminal on first start, then stored in `~/.3evo/auth.json`.

If you are locked out or forgot the password:
1. Set `AUTH_RESET_TOKEN=something` in `.env`
2. `curl -X POST http://localhost:20128/api/auth/reset -H "Content-Type: application/json" -d '{"token":"something","password":"newpass"}'`
3. Or delete `~/.3evo/auth.json` and restart (only works if `ADMIN_PASSWORD` is set in `.env`)

You can also change the password from the dashboard Settings page after logging in.

## Quick start

```bash
git clone https://github.com/soroushse7o/3EVO-router.git
cd 3EVO-router
npm install
npm run dev
```

Dashboard: `http://localhost:20128/`

## Project structure

```
src/
├ app/
│   ├ (auth)/login/page.tsx
│   ├ (dashboard)/
│   │   ├ page.tsx
│   │   ├ endpoint/page.tsx
│   │   ├ providers/page.tsx
│   │   ├ proxy-pools/page.tsx
│   │   ├ combos/page.tsx
│   │   ├ usage/page.tsx
│   │   ├ quota/page.tsx
│   │   ├ mitm/page.tsx
│   │   ├ cli-tools/page.tsx
│   │   ├ console-log/page.tsx
│   │   ├ settings/page.tsx
│   │   └ layout.tsx
│   └ api/
│       ├ auth/route.ts
│       ├ v1/
│       │   ├ chat/completions/route.ts
│       │   ├ messages/route.ts
│       │   ├ models/route.ts
│       │   └ responses/route.ts
│       ├ combo/run/route.ts
│       ├ health/route.ts
│       ├ log/stream/route.ts
│       ├ oauth/start/route.ts
│       ├ oauth/callback/route.ts
│       ├ oauth/verify/route.ts
│       ├ quota/route.ts
│       ├ route/test/route.ts
│       ├ rtk/route.ts
│       ├ settings/
│       │   ├ route.ts
│       │   ├ cloud/route.ts
│       │   ├ export/route.ts
│       │   └ import/route.ts
│       ├ usage/route.ts
│       ├ proxy-pools/route.ts
│       └ mitm/
│           ├ status/route.ts
│           ├ toggle/route.ts
│           ├ allowlist/route.ts
│           └ cert/route.ts
├ cli/index.ts
├ lib/
│   ├ accounts.ts            # OAuth tokens (encrypted)
│   ├ api-key.ts             # API key generation/validation
│   ├ auth.ts                # scrypt auth, session management
│   ├ circuit.ts             # circuit breaker
│   ├ combo.ts               # combo schema
│   ├ cors.ts                # CORS allowlist
│   ├ cost.ts                # cost estimation
│   ├ csrf.ts                # CSRF validation
│   ├ db.ts                  # SQLite usage logging
│   ├ gemini.ts              # Gemini translator
│   ├ i18n.ts                # EN/FA translation helper
│   ├ mitm-certs.ts          # Root cert generation
│   ├ oauth-flows.ts         # Device-code flow, refresh
│   ├ oauth.ts               # OAuth helpers
│   ├ proxy.ts               # Node.js runtime proxy
│   ├ rate-limit.ts          # Rate limiting
│   ├ refresh.ts             # Reactive token refresh
│   ├ router.ts              # runWithFallback, streamWithFallback
│   ├ rtk.ts                 # token compression
│   ├ scrubber.ts            # log scrubbing
│   ├ ssrf.ts                # SSRF protection
│   ├ translator.ts          # OpenAI/Anthropic/Gemini/Responses
│   ├ vault.ts               # AES-256-GCM encryption
│   └ __tests__/
│       ├ p1-security.test.ts
│       ├ rtk.test.ts
│       ├ scrubber.test.ts
│       ├ security.test.ts
│       ├ router.integration.test.ts
│       └ translator.golden.test.ts
├ gateway/
│   ├ index.ts               # Hono gateway
│   ├ server.ts              # Node server + health
│   └ health.ts              # Health endpoint
├ components/
│   └ lang-toggle.tsx        # EN/FA language toggle
└ data/
    └ providers.json         # Provider list
```

## Roadmap (Honest)

| Phase | Status | Description |
|-------|--------|-------------|
| P0 | ✅ | Baseline honesty: docs match code, hardcoded secrets removed |
| P1 | ✅ | Security hardening: S1–S15 complete (S10 TODO) |
| P2 | 🔄 | Real routing core: multi-tier, circuit breaker, timeouts |
| P3 | ⏳ | Translator & streaming fixes |
| P4 | ⏳ | Real providers/OAuth or honest removal |
| P5 | ⏳ | Usage/quota/RTK fixes |
| P6 | ⏳ | UI/i18n/CLI/tests polish |

## License

MIT — see [LICENSE](LICENSE).

For Persian documentation, see [README.fa.md](README.fa.md).
