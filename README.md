# 3EVO Router (Endpoint Proxy)

Local-first AI gateway + web dashboard. Exposes one OpenAI/Anthropic-compatible endpoint and routes requests across many providers with multi-account rotation, 3-tier fallback combos, and RTK token compression.

## Quick start
```bash
npm install
cp .env.example .env   # optional
npm run dev
```
Panel: `http://localhost:20128/` (or `http://localhost:20128/<SECRET_PATH>` if set)

## Environment variables
```
PORT=20128
BASE_URL=http://localhost:20128
SECRET_PATH=                # optional 16-32 char secret path for panel
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

## Security notes
- Default bind 127.0.0.1. Remote binding requires auth.
- Set `SECRET_PATH` to hide the panel behind a secret URL segment.
- Secrets are encrypted at rest (AES-256-GCM) and never returned after save.
- Cloud sync never blocks the UI.

## License
MIT
