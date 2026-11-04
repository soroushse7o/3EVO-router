# 3EVO Router — Local AI Gateway

One local endpoint that proxies OpenAI/Anthropic-compatible requests to multiple upstream providers, with failover, encrypted secret storage, and a web dashboard.

> **Status: Stable — v1.0.0**

## Features

| Feature | Status | Notes |
|---------|--------|-------|
| `/v1/chat/completions` proxy | Working | OpenAI-compatible |
| `/v1/messages` proxy | Working | Anthropic-compatible |
| `/v1/responses` proxy | Working | OpenAI responses |
| `/v1/models` | Working | Aggregated upstream models |
| Dashboard login | Working | scrypt + HttpOnly session cookies |
| Password reset | Working | `/api/auth/reset` |
| API key management | Working | Settings UI + `/api/api-keys` |
| Vault encrypt/decrypt | Working | AES-256-GCM, `master.key` in `DATA_DIR` |
| Multi-tier failover | Working | ordered provider fallback |
| Provider pricing | Working | `price_per_1k_in/out` in SQLite |
| Circuit breaker | Working | in-memory, per-provider |
| Rate limiting | Working | 120 req/min per API key |
| Metrics endpoint | Working | `/api/metrics` with provider/route stats |
| Structured logs + request IDs | Working | `src/lib/logger.ts`, `src/lib/reqId.ts` |
| Persian/RTL UI | Partial | dashboard and main components |
| SSE streaming | Working | `src/lib/streamController.js` |
| OAuth provider support | Working | Google, GitHub flows + connection management |
| OAuth token refresh | Working | auto-refresh before expiry |
| OAuth health checks | Working | expiry alerts via `/api/oauth` |
| Central auth guard | Working | deny-by-default, middleware + route handlers |
| Progressive login lockout | Working | exponential backoff |
| CLI token auth | Working | machine-ID based |
| Trusted peer header validation | Working | `x-3r-peer-token` |
| Repository pattern | Working | barrel export in `src/lib/db/index.ts` |
| Settings management + UI | Working | `settings` table + `/api/settings` |
| Instrumentation | Working | request timing, provider stats |
| Monthly budget limits | Working | configurable cap in Settings |
| Model aliases + fallback chains | Working | `model_aliases` table |
| Request details tab | Working | full headers/body capture |
| Playwright E2E tests | Partial | `playwright-tests/basic.spec.ts` |
| Packaged installer | In progress | `pkg` scripts for Windows/macOS/Linux |
| Docker image | Working | Multi-stage Dockerfile with standalone output |

## Architecture

```
Client (OpenAI/Anthropic SDK)
        │
        ▼
  ┌─────────────┐
  │  Next.js    │  /v1/* routes (Node.js runtime)
  │  API routes │
  └──────┬──────┘
         │
   ┌─────┴─────┐
   │  Router   │  failover, circuit breaker, timeouts
   └─────┬─────┘
         │
   ┌─────┴─────────────────────┐
   │ Providers (SQLite + Vault)│  base URL + encrypted API key
   └───────────────────────────┘
```

- **Storage**: SQLite (`better-sqlite3` with `sql.js` fallback) in `DATA_DIR` (default: `~/.3evo`).
- **Secrets**: AES-256-GCM, key stored in `DATA_DIR/master.key`.
- **Port**: `20128` by default.
- **Node**: >= 22.

## Security

- Default bind: `127.0.0.1`.
- Default dashboard password: `123456789` (change in Settings).
- Dashboard auth: cookie-based session with scrypt password hashing.
- Progressive login lockout: 5 failed attempts → 30s/120s/600s/1800s lockouts.
- CLI token auth: machine-ID-based token for non-interactive clients.
- Trusted peer bypass: `x-3r-peer-token` header for local proxies.
- Secrets stored encrypted; no plaintext API keys on disk.
- Rate limiting: 120 requests/minute per API key.
- SSRF protection: private/link-local ranges blocked; `localhost` must be explicitly allowlisted via `ALLOWED_UPSTREAM_HOSTS`.

## Quick start

```bash
git clone https://github.com/soroushse7o/3EVO-router.git
cd 3EVO-router
npm install
npm run dev
```

Dashboard: http://localhost:20128/login

Default password: `123456789`

### First API key

1. Open http://localhost:20128/login and sign in.
2. Go to Settings → API Keys → Create.
3. Copy the key and use it as `Authorization: Bearer <key>` against `/v1/chat/completions`.

### Add a provider

1. Providers → Add Provider → fill Name, Base URL, API Key, Model.
2. Click Test to verify connectivity through the SSRF guard.
3. Requests to `/v1/chat/completions` and `/v1/messages` now fail over through your providers in order.

### Docker

```bash
docker build -t 3evo-router .
docker run -p 20128:20128 -v 3evo-data:/home/nextjs/.3evo 3evo-router
```

### Standalone binaries

Pre-built binaries are available for Windows, macOS, and Linux. Alternatively, build them yourself:

```bash
npm install
npm run package:win      # Windows: dist/3evo-router.exe
npm run package:macos    # macOS: dist/3evo-router-macos
npm run package:linux    # Linux: dist/3evo-router-linux
```

The binary runs the same Next.js standalone server and accepts the same environment variables (`PORT`, `BASE_URL`, `DATA_DIR`, `ADMIN_PASSWORD`).

## Live Demo

A static demo of the dashboard is available at:
- [View Dashboard Demo](https://soroushse7o.github.io/3EVO-router/demo/)

## Project structure

```
src/
├ app/
│   ├ (auth)/login/page.tsx
│   ├ (dashboard)/
│   │   ├ page.tsx
│   │   ├ aliases/page.tsx
│   │   ├ endpoint/page.tsx
│   │   ├ providers/page.tsx
│   │   ├ request-details/page.tsx
│   │   ├ settings/page.tsx
│   │   ├ usage/page.tsx
│   │   └ layout.tsx
│   └ api/
│       ├ aliases/route.ts
│       ├ aliases/[id]/route.ts
│       ├ api-keys/route.ts
│       ├ api-keys/[id]/route.ts
│       ├ auth/route.ts
│       ├ auth/reset/route.ts
│       ├ health/route.ts
│       ├ log/route.ts
│       ├ metrics/route.ts
│       ├ oauth/route.ts
│       ├ oauth/connections/[id]/route.ts
│       ├ providers/route.ts
│       ├ providers/[id]/route.ts
│       ├ request-details/route.ts
│       ├ route/test/route.ts
│       ├ settings/route.ts
│       ├ usage/route.ts
│       └ v1/
│           ├ chat/completions/route.ts
│           ├ messages/route.ts
│           ├ models/route.ts
│           └ responses/route.ts
└ lib/
    ├ auth.ts                # scrypt auth, session management
    ├ api-key.ts             # API key generation/validation
    ├ vault.ts               # AES-256-GCM encryption
    ├ router.ts              # failover + streaming + aliases
    ├ circuit.ts             # circuit breaker
    ├ ssrf.ts                # SSRF protection
    ├ scrubber.ts            # log scrubbing
    ├ logger.ts              # structured logs
    ├ reqId.ts               # request IDs
    ├ rateLimit.ts           # per-key rate limiting
    ├ streamController.js    # SSE disconnect cleanup
    ├ translator.ts          # OpenAI/Anthropic format translator
    ├ i18n.ts                # EN/FA translation helper
    ├ paths.ts               # DATA_DIR paths
    ├ db.ts                  # SQLite back-compat accessor
    ├ dashboardGuard.ts      # deny-by-default auth guard
    ├ loginLimiter.ts        # progressive login lockout
    ├ cliToken.ts            # machine-ID CLI token auth
    ├ instrumentation.ts     # request timing + provider/route stats
    ├ budget.ts              # monthly budget enforcement
    ├ providers/
    │   ├ DefaultExecutor.ts # standardized provider execution
    │   └ index.ts
    ├ auth/
    │   ├ trustedPeer.ts     # trusted peer header validation
    │   └ dashboardSession.js # HS256 JWT sessions
    ├ db/
    │   ├ driver.js           # multi-adapter SQLite
    │   ├ adapters/           # better-sqlite3, node:sqlite, sql.js, bun:sqlite
    │   ├ helpers/nullBytes.js
    │   ├ paths.js
    │   ├ migrate.js
    │   ├ migrations/schema.sql
    │   ├ index.ts            # barrel export for all repos
    │   └ repos/
    │       ├ aliasesRepo.js
    │       ├ apiKeysRepo.js
    │       ├ authRepo.js
    │       ├ lockoutRepo.js
    │       ├ providersRepo.js
    │       ├ requestDetailsRepo.js
    │       ├ sessionsRepo.js
    │       ├ settingsRepo.js
    │       └ usageRepo.js
    └ __tests__/
        ├ p1-security.test.ts
        ├ security.test.ts
        ├ router.integration.test.ts
        ├ e2e-fallback.test.ts
        ├ scrubber.test.ts
        └ translator.golden.test.ts
```

## Documentation

- `docs/CHECKLIST.md` — v0.1 build checklist
- `docs/STATUS.md` — live build/test output
- `docs/ARCHITECTURE.md` — internal design notes
- `docs/LEGAL.md` — licensing and subscription token routing note
- `docs/SCOPE.md` — v0.1 scope
- `docs/CLIENTS.md` — supported client configurations

## Verified tests

```
> npx vitest run src/lib/__tests__
Test Files  6 passed (6)
     Tests  60 passed (60)
```

## License

MIT — see `LICENSE`.
