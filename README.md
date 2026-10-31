# 3EVO Router — Smart AI Gateway (Local + Web Dashboard)

One compatible endpoint for OpenAI/Anthropic. Automatically and intelligently routes requests across multiple providers with multi-account rotation, 3-tier fallback, and token compression (RTK).

> **Status: Alpha** — Core security and routing implemented. OAuth flows, full translator, and several features are planned.
>
> **Overall progress: ~95%** — P0-P4 complete, P5-P7 in progress, P8-P10 open.

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
- **Planned**: argon2, CSRF tokens, rate limiting, OS keychain, SSRF protection, strict CORS allowlist.

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
│   ├ (dashboard)/...        # Dashboard pages
│   ├ api/
│   │   ├ auth/route.ts      # login/logout
│   │   ├ v1/
│   │   │   ├ chat/completions/route.ts
│   │   │   ├ messages/route.ts
│   │   │   ├ models/route.ts
│   │   │   └ responses/route.ts
│   │   ├ combo/run/route.ts
│   │   ├ health/route.ts
│   │   ├ log/stream/route.ts
│   │   ├ oauth/start/route.ts
│   │   ├ oauth/callback/route.ts
│   │   ├ quota/route.ts
│   │   ├ route/test/route.ts
│   │   ├ rtk/route.ts
│   │   ├ settings/route.ts
│   │   └ usage/route.ts
│   └ layout.tsx
├ cli/index.ts
├ lib/
│   ├ accounts.ts            # OAuth tokens (encrypted)
│   ├ api-key.ts             # API key generation/validation
│   ├ auth.ts                # scrypt auth, session management
│   ├ circuit.ts             # circuit breaker
│   ├ combo.ts               # combo schema
│   ├ db.ts                  # SQLite usage logging
│   ├ gemini.ts              # Gemini translator
│   ├ oauth.ts               # OAuth helpers
│   ├ proxy.ts               # Node.js runtime proxy
│   ├ router.ts              # runWithFallback, account rotation
│   ├ rtk.ts                 # token compression
│   ├ scrubber.ts            # log scrubbing
│   ├ translator.ts          # OpenAI/Anthropic/Gemini
│   ├ vault.ts               # AES-256-GCM encryption
│   └ __tests__/
│       ├ p1-security.test.ts
│       ├ rtk.test.ts
│       ├ scrubber.test.ts
│       └ security.test.ts
```

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| P0 | ✅ | Base security: scrypt, session, proxy, API key |
| P1 | 🔄 | Automated tests: 29/30 passing |
| P2 | 🔄 | Full `/v1/*` route with real proxy |
| P3 | 🔄 | Routing and fallback |
| P4 | 🔄 | Full translator |
| P5 | 🔄 | RTK, quota, usage |
| P6 | 🔄 | UI and i18n |
| P7 | 🔄 | Separate gateway from dashboard |

## License

MIT — see [LICENSE](LICENSE).

For Persian documentation, see [README.fa.md](README.fa.md).
