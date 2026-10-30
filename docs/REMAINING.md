# 3EVO Router — Remaining Roadmap to 100%

## Current: ~94% complete

### Phase A — OAuth Flows (real)
- [ ] Implement device-code flow for each OAuth provider (Claude Code, Codex, Copilot, Cursor, Kilo, Cline, Antigravity)
- [ ] Token refresh proactive (before expiry) + reactive on 401
- [ ] Store tokens in vault; show status in drawer
- [ ] Mark verified:true in data/providers.json after live check

### Phase B — Translator (full) + streaming
- [ ] Gemini format conversion
- [ ] OpenAI Responses API full support
- [ ] Ollama/Cursor/Kiro/Vertex/Antigravity adapters
- [ ] Golden-file tests per pair
- [ ] Mid-stream failover (no bytes sent → transparent; started → error event)

### Phase C — Routing & failover (integrated)
- [x] Wire runWithFallback into /v1/* endpoints
- [ ] Account rotation (round-robin/priority) per provider
- [ ] Cooldown + Retry-After honoring
- [ ] Circuit breaker integration (half-open probe)
- [ ] All-tiers-exhausted error body (list tried, soonest reset)
- [ ] Dashboard alert

### Phase D — Usage + Quota (DB-backed UI)
- [ ] Wire /api/usage into Usage page (fetch + CSV export)
- [ ] Wire /api/quota into Quota Tracker page
- [ ] RTK savings measurement (before/after tokens) recorded
- [ ] Cost per 1M native vs after RTK

### Phase E — Settings (full)
- [ ] Port, bind address, auth password change
- [ ] Language/theme toggle persisted
- [ ] RTK options, fallback options
- [ ] Cloud sync with timeout (no UI freeze)
- [ ] Data export/import (secrets excluded unless encrypted)

### Phase F — Proxy pools, CLI tools, console log (real)
- [ ] Proxy CRUD + health check + assignment + rotation
- [ ] CLI tools: detect installed clients, generate/apply config (backup, diff, undo)
- [ ] Console log: SSE live stream with level filter + search + secret masking

### Phase G — MITM (full, opt-in)
- [ ] Consent screen + root cert generation (user installs)
- [ ] Per-host allowlist, one-click uninstall/revoke

### Phase H — Hardening & docs
- [ ] Security checklist pass
- [x] Log scrubber tests
- [ ] e2e smoke (Playwright)
- [x] README EN+FA final
- [ ] docs/CLIENTS.md (Cursor, Cline, Claude Code, Codex, OpenClaw)
- [ ] docs/ASSUMPTIONS.md

## Estimated remaining: ~6% (a few hours of focused work)