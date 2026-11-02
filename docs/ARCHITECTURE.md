# 3EVO Router — Architecture

## Scope

Single-user, local-first gateway. One developer plus an agent. Alpha quality.

## Runtime

- Next.js 16 App Router.
- API routes run in Node.js runtime; dashboard pages run on the client.
- `src/lib/auth.ts` enforces auth and API-key checks before route handlers run.

## Storage

- SQLite (`better-sqlite3` with `sql.js` fallback) in `$DATA_DIR`.
- Tables: `usage`, `sessions`, `api_keys`, `lockout`, `auth`, `providers`, `_meta`.
- Secrets encrypted with AES-256-GCM (`src/lib/vault.ts`); `master.key` lives in `$DATA_DIR`.

## Request flow

```
Client
  → src/lib/auth.ts (auth / API key)
    → /v1/chat/completions | /v1/messages | /v1/responses | /v1/models
      → buildProviderTiers() decrypts provider keys from SQLite
        → runWithFallback / streamWithFallback
          → upstream provider
```

## Failover

- Ordered list of providers from SQLite.
- 429, 5xx, timeout, network → next provider.
- 4xx and auth errors → pass through, no failover.
- Circuit breaker per provider; one half-open probe.

## Security

- Auth: scrypt password hashing, expiring sessions in SQLite.
- API keys: scrypt hash + salt in SQLite; plaintext key shown once at creation.
- SSRF: private/link-local ranges blocked; localhost only when explicitly allowlisted via `ALLOWED_UPSTREAM_HOSTS`.
- Rate limiting: 120 requests/minute per API key.
- Structured logs with request IDs; scrubber masks secrets.

## What is not in v0.1

Subscription OAuth, MITM, RTK, quota/cost estimation, proxy pools, cloud sync, Persian UI, multi-user.

## Testing

- Vitest: `src/lib/__tests__/` (60 tests).
- Playwright smoke test planned for P1.
