# Assumptions

- Single local gateway endpoint by default; remote binding requires explicit auth and TLS.
- SQLite (`better-sqlite3`) is the only local storage, under `~/.3evo/`.
- Secrets are encrypted with AES-256-GCM; key comes from OS keychain or scrypt-derived master file (0600).
- OAuth flows require explicit user consent; tokens are stored encrypted and never logged.
- RTK compression applies only to `tool_result` messages; other content types pass through unchanged.
- Circuit breaker default: 3 failures → open, 30s cooldown, half-open probe.
- Combo tiers are defined per user; fallback triggers: 429/5xx/timeout/401.
- Streaming passthrough preserves SSE; mid-stream failover returns an error event rather than silent partial output.
- No telemetry or cloud sync by default; optional sync endpoint respects a short timeout and never blocks the UI.
- Secrets never appear in logs, errors, usage stats, or exported CSVs; log scrubber masks known patterns and tests enforce it.
