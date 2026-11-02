# 3EVO Router — v0.1 Scope

## In scope

- Working login, plus API key create/list/revoke in the dashboard.
- Add provider (OpenAI-compatible base URL plus API key, encrypted at rest) with a
  Test button that goes through the SSRF guard.
- One ordered failover list per model alias.
- `POST /v1/chat/completions` (stream and non-stream) and `GET /v1/models`.
- A circuit breaker keyed per provider.
- A usage page with real upstream token counts, latency and status.
- `GET /api/health` (public, minimal).
- `/v1/messages` (Anthropic-compatible), so Claude-style clients work.
- Truthful README, CHANGELOG, and one-command start (Docker or `npx`).

## Out of scope (v0.1)

- Subscription OAuth, MITM, RTK, quota/cost estimation, proxy pools, cloud sync,
  `/v1/responses`, Persian UI, multi-user.
