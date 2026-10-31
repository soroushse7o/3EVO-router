# 3EVO Router — Smart AI Gateway (Local + Web Dashboard)

One compatible endpoint for OpenAI/Anthropic. Automatically and intelligently routes requests across multiple providers with multi-account rotation, 3-tier fallback, and token compression (RTK).

> **Status: v1.0.0** — Stable release. All core features implemented and tested.
>
> **Overall progress: 100%** — v1 ready for use and demo.

## Features

- **Single endpoint** — OpenAI (`/v1/chat/completions`, `/v1/responses`), Anthropic (`/v1/messages`), `/v1/models`.
- **Real authentication** — Password hashed with scrypt, server-side session storage and validation.
- **API Key** — Random key generation, only hash stored with scrypt + salt, validation in route handlers.
- **OAuth account rotation** — Round-robin and priority strategies.
- **3-tier fallback** — Fallback between tiers.
- **Circuit breaker** — 3 failures threshold, 30s cooldown, half-open state.
- **RTK (Result Token Keeper)** — Compresses duplicate output tokens, max 4000 chars.
- **Quota tracker** — 5-hour rolling window.
- **Usage DB** — Usage logging in SQLite.
- **Log scrubber** — Scrubs tokens from logs.
- **Dashboard** — Web panel for managing providers, accounts, usage, quota, settings.
- **i18n** — English + Persian (RTL, Vazirmatn).

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

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| P0 | ✅ | Base security: scrypt, session, proxy, API key |
| P1 | ✅ | Automated tests: 48/48 passing |
| P2 | ✅ | Full `/v1/*` routes with real llama-server upstream |
| P3 | ✅ | Routing and fallback with circuit breaker |
| P4 | ✅ | Full translator: OpenAI/Anthropic/Gemini/Responses |
| P5 | ✅ | RTK, quota, usage with cost estimation |
| P6 | ✅ | UI and i18n (EN/FA, RTL, lang toggle) |
| P7 | ✅ | Separate Hono gateway server |
| P8 | ✅ | Hardening: rate limiting, CSRF, SSRF, CORS |
| P9 | ✅ | E2E smoke tests (Playwright scaffold) |
| P10 | ✅ | Proxy pools CRUD, CLI tools config generation |

## License

MIT — see [LICENSE](LICENSE).

For Persian documentation, see [README.fa.md](README.fa.md).
