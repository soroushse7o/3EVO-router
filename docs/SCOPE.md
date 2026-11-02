# 3EVO Router — v0.1 Scope

## In scope

- Working login, plus API key create/list/revoke in the dashboard.
- Add provider (OpenAI-compatible base URL plus API key, encrypted at rest) with a
  Test button that goes through the SSRF guard.
- One ordered failover list per model alias.
- `POST /v1/chat/completions` (stream and non-stream), `GET /v1/models`.
- `POST /v1/messages` (Anthropic-compatible), so Claude-style clients work.
- `POST /v1/responses` (OpenAI Responses-compatible translator to chat completions).
- A circuit breaker keyed per provider.
- A usage page with real upstream token counts, latency and status.
- `GET /api/health` (public, minimal).
- Structured logs with request IDs; log scrubber masks secrets.
- Per-key rate limiting (120 requests/minute).
- Metrics endpoint (`/api/metrics`) with usage aggregates.
- Truthful README (EN/FA), CHANGELOG, and one-command start (Docker or `npm run dev`).

## Out of scope (v0.1)

Subscription OAuth, MITM, RTK, quota/cost estimation, proxy pools, cloud sync, Persian UI, multi-user.
