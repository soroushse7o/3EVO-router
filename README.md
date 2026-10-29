# 3EVO Router

Local-first AI gateway + web dashboard ("Endpoint Proxy"). Exposes one OpenAI/Anthropic-compatible endpoint and routes requests across many providers with multi-account rotation, 3-tier fallback combos, and token compression (RTK).

## Quick start
```
npm install
npm run dev
```
Open http://localhost:20128

## Client setup
```
export OPENAI_BASE_URL="http://localhost:20128/v1"
export OPENAI_API_KEY="<router-key-from-dashboard>"
export ANTHROPIC_BASE_URL="http://localhost:20128"
export ANTHROPIC_AUTH_TOKEN="<router-key-from-dashboard>"
```

## License
MIT
