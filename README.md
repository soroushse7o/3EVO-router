# 3EVO Router — Local AI Gateway

Single local endpoint that proxies OpenAI/Anthropic-compatible requests to one or more upstream providers with failover and encrypted secret storage.

> **Status: Alpha — not production-ready.** See `docs/CHECKLIST.md` for what ships in v0.1.

## What works today

- Dashboard login with scrypt password hashing and expiring sessions.
- API key create/list/revoke in Settings; `/v1/chat/completions`, `/v1/messages`, `/v1/models`, and `/v1/responses` require a valid key.
- Add custom OpenAI-compatible providers from the dashboard (base URL + API key + optional pricing), stored encrypted at rest.
- Ordered provider failover: 429, 5xx, timeout, and network errors fall through to the next provider; 4xx and auth errors pass through unchanged.
- Circuit breaker per provider; closes again on success.
- Streaming passthrough for `/v1/chat/completions` and `/v1/messages`.
- Usage rows written to SQLite (`data.db`) with real upstream token counts when available.
- SSRF guard: private/link-local ranges are blocked; `localhost` must be explicitly allowlisted via `ALLOWED_UPSTREAM_HOSTS`.
- All secrets encrypted with AES-256-GCM (`master.key`); no plaintext API keys on disk.
- Public `/api/health` endpoint.
- Structured logs with request IDs; log scrubber masks secrets.
- Per-key rate limiting (120 requests/minute).
- Metrics endpoint (`/api/metrics`) with usage aggregates.
- GitHub Actions CI and Dockerfile included.

## What is intentionally out of scope for v0.1

Subscription OAuth, MITM, RTK, quota/cost estimation, proxy pools, cloud sync, Persian UI, multi-user.

## Verified tests

```
> npx vitest run src/lib/__tests__
Test Files  6 passed (6)
     Tests  60 passed (60)
```

## Quick start

```bash
git clone https://github.com/soroushse7o/3EVO-router.git
cd 3EVO-router
npm install
npm run dev
```

Dashboard: `http://localhost:20128/`

Default admin password: `123456789` (change it in Settings after first login)

### First API key

1. Open `http://localhost:20128/` and log in with `123456789`.
2. Go to Settings → API Keys → Create.
3. Copy the key; use it as `Authorization: Bearer <key>` against `/v1/chat/completions`.

### Add a provider

1. Providers → Custom Providers → fill Name, Base URL, API Key, Model.
2. Click Test to verify connectivity through the SSRF guard.
3. Requests to `/v1/chat/completions` and `/v1/messages` now fail over through your providers in order.

### Docker

```bash
docker build -t 3evo-router .
docker run -p 20128:20128 -v 3evo-data:/home/appuser/.3evo 3evo-router
```

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
   │  Router   │  provider failover, circuit breaker, timeouts
   └─────┬─────┘
         │
   ┌─────┴─────────────────────┐
   │ Providers (SQLite + Vault)│  base URL + encrypted API key per provider
   └───────────────────────────┘
```

- **Storage**: SQLite (`better-sqlite3` with `sql.js` fallback) at `$DATA_DIR` (default `~/.3evo`).
- **Secrets**: AES-256-GCM with `master.key` in `$DATA_DIR`.
- **Port**: `20128` by default.
- **Node**: >= 18.

## Documentation

- `docs/CHECKLIST.md` — v0.1 build checklist
- `docs/STATUS.md` — live build/test output
- `docs/ARCHITECTURE.md` — internal design notes
- `docs/LEGAL.md` — licensing and subscription token routing note
- `docs/SCOPE.md` — v0.1 scope
- `docs/CLIENTS.md` — supported client configurations

## License

MIT — see `LICENSE`.
