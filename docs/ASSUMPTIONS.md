# Assumptions

- Single local gateway endpoint by default; remote binding requires explicit auth and TLS.
- SQLite (`better-sqlite3` with `sql.js` fallback) is the only local storage, under `$DATA_DIR` (default `~/.3evo`).
- Secrets are encrypted with AES-256-GCM; `master.key` lives in `$DATA_DIR` with mode `0600`.
- Circuit breaker default: 3 failures → open, 30s cooldown, half-open probe.
- Streaming passthrough preserves SSE; mid-stream failover returns an error event rather than silent partial output.
- No telemetry or cloud sync by default; secrets never appear in logs, errors, usage stats, or exported CSVs; log scrubber masks known patterns and tests enforce it.
- Provider pricing is optional; when set, usage rows include cost estimation.
- Per-key rate limiting is 120 requests/minute.
- `ALLOWED_UPSTREAM_HOSTS` env controls which upstream hosts are reachable; private/link-local ranges are always blocked.
