# 3EVO Router (Endpoint Proxy)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-%3E%3D20-339933)](package.json)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)

**Local-first AI gateway + web dashboard.** Exposes a single OpenAI/Anthropic-compatible endpoint and routes requests across many providers with multi-account rotation, 3-tier fallback combos, and RTK token compression.

> Open source (MIT). Built for developers who want zero downtime, lower token cost, and no secret leakage.

## Table of contents
- [Features](#features)
- [Architecture](#architecture)
- [Security](#security)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Client setup](#client-setup)
- [Project structure](#project-structure)
- [Roadmap](#roadmap)
- [License](#license)

## Features
- **Single endpoint** — OpenAI (`/v1/chat/completions`, `/v1/responses`), Anthropic (`/v1/messages`), `/v1/models`.
- **Universal format translator** — OpenAI ↔ Anthropic ↔ Gemini ↔ OpenAI Responses via one canonical format.
- **Multi-account rotation** — round-robin / priority per provider.
- **3-tier fallback combos** — primary → low-cost → free/credit, with per-tier triggers (429/5xx/timeout/401).
- **Circuit breaker** + cooldown + Retry-After honoring.
- **RTK (Result Token Keeper)** — compresses repetitive `tool_result` content; measured real savings.
- **Quota tracker** — 5-hour rolling window, daily/monthly limits, reset countdown.
- **Proxy pools** — HTTP/SOCKS outbound with health checks.
- **CLI tools integration** — Claude Code, Cursor, Cline, Codex, OpenClaw config generation (backup + diff + undo).
- **MITM (opt-in)** — local only, explicit consent, user-installed root cert.
- **i18n** — English + Persian (RTL, Vazirmatn).
- **Dark/light theme**, glass cards, emerald accent.

## Architecture
```
Client (OpenAI/Anthropic SDK)
        │
        ▼
  ┌─────────────┐
  │  Gateway    │  /v1/*  (Next.js API routes)
  │  Translator │  (canonical format)
  └──────┬──────┘
         │
   ┌─────┴─────┐
   │  Router   │  combos, tiers, rotation, circuit breaker
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

- Storage: SQLite (`better-sqlite3`) in `~/.3evo/`.
- Secrets: AES-256-GCM, key from OS keychain, fallback scrypt-derived master file (0600).
- CLI: `3evo-router --port 20128 [--daemon] [--no-rtk]`.

## Security
- Default bind `127.0.0.1`. Remote binding requires auth.
- `SECRET_PATH` (16-32 chars) hides panel behind a secret URL segment.
- Dashboard auth: argon2/scrypt, HttpOnly + SameSite=Strict cookies, CSRF, rate limiting.
- Secrets never returned after save (masked `sk-…abcd`), never in logs/errors/usage; log scrubber with tests.
- Strict CORS allowlist; SSRF protection on custom provider URLs.
- Remote access via Cloudflare Tunnel / TLS only; plain HTTP rejected for non-localhost.
- No upstream telemetry; update check opt-in.
- One-time ToS notice about subscription OAuth usage.

## Quick start
```bash
npm install
cp .env.example .env   # optional
npm run dev
```
Panel: `http://localhost:20128/` (or `http://localhost:20128/<SECRET_PATH>`)

## Configuration
```
PORT=20128
BASE_URL=http://localhost:20128
SECRET_PATH=                # optional 16-32 char secret path
DATA_DIR=~/.3evo
CLOUD_URL=                 # optional sync endpoint
SYNC_TIMEOUT_MS=1500
```

## Client setup
```bash
export OPENAI_BASE_URL="http://localhost:20128/v1"
export OPENAI_API_KEY="<router-key-from-dashboard>"
export ANTHROPIC_BASE_URL="http://localhost:20128"
export ANTHROPIC_AUTH_TOKEN="<router-key-from-dashboard>"
```

## Project structure
```
src/
  app/            # Next.js App Router (dashboard + api)
  lib/            # vault, rtk, combo schema, providers
  cli/            # CLI entry
data/             # providers.json
locales/          # en.json, fa.json
```

## Roadmap
- [x] Scaffold (Next.js, TS, Tailwind)
- [x] Providers page (interactive)
- [x] Gateway proxy to local model
- [x] Auth (real)
- [x] Anthropic /v1/messages + OpenAI /v1/responses
- [x] RTK lib
- [x] Combo schema (Zod)
- [x] Combos page (3 templates)
- [x] MITM opt-in consent (stub)
- [x] Usage page
- [x] Quota tracker page
- [ ] OAuth flows
- [ ] Translator + streaming
- [ ] Routing/failover + circuit breaker
- [ ] Usage + Quota (DB)
- [ ] Proxy pools, CLI tools, console log, settings
- [ ] Hardening + tests + docs

## License
MIT — see [LICENSE](LICENSE).
