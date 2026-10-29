# 3EVO Router — Requirements Checklist

## 0. Role & Mission
1. Build local-first AI gateway + web dashboard "Endpoint Proxy".
2. Single OpenAI/Anthropic-compatible endpoint.
3. Multi-account rotation, 3-tier fallback combos, token compression (RTK).
4. Local endpoint http://localhost:20128/v1.
5. Goals: no developer downtime, no secret leakage, lower token cost, resilient fallback.
6. Support clients: Claude Code, Cursor, Cline, Codex, OpenClaw, any OpenAI/Anthropic SDK.

## 1. Working Rules
7. No questions; decide and log in docs/ASSUMPTIONS.md.
8. Work in phases; finish+verify each before next; never broken state.
9. No fake data / placeholder screens; buttons real or visibly disabled with reason.
10. Never hardcode model names/prices/free-tier claims; load from data/providers.json or provider /models; mark verified true|false.
11. Tests for translator, router/fallback, RTK, token vault, auth; run & fix.
12. If secret in chat/logs/prompt, replace with [REDACTED_SECRET] and warn.

## 2. Stack
13. Node.js >=20, TypeScript, Next.js App Router, Tailwind.
14. SQLite (better-sqlite3) in ~/.3evo/ for config/usage/accounts.
15. Secrets in encrypted vault (AES-256-GCM, key OS keychain, fallback scrypt-derived from local master file 0600).
16. Single CLI package 3evo-router -> 3evo-router --port 20128 [--daemon] [--no-rtk]. Runs in terminal; browser close doesn't stop; dashboard Shutdown stops.
17. Fonts Inter (EN), Vazirmatn (FA), bundled locally (no CDN).

## 3. Target UI
18. Dark theme, deep navy/black, emerald accent ~#10E58A, glass cards, 16px radius, subtle borders.
19. Sidebar: logo + "Endpoint Proxy" + version badge from package.json.
20. Nav: Endpoint, Providers, Proxy Pools, Combos, Usage, Quota Tracker, MITM, CLI Tools.
21. DEBUG section: Console Log. SYSTEM section: Settings.
22. Bottom info box + Shutdown button (confirm dialog).
23. Top bar: page title+subtitle, language dropdown (English/فارسی), light/dark toggle, logout.
24. Providers page: 4 sections, 4-col grid (2 tablet, 1 mobile).
25. OAuth Providers (count badge, Test All): Claude Code, Antigravity, OpenAI Codex, GitHub Copilot, Cursor IDE, Kilo Code, Cline.
26. Free Providers: iFlow AI, Qwen Code, Gemini CLI, Kiro AI, OpenCode Free.
27. API Key Providers: OpenRouter, GLM Coding, GLM (China), Kimi, Minimax Coding, Minimax (China), Alibaba, Alibaba Intl, OpenAI, Anthropic, Gemini, DeepSeek, Groq, xAI (Grok), Mistral, Perplexity, Together AI, Fireworks AI, Cerebras, Cohere, NVIDIA NIM, Nebius AI, SiliconFlow, Hyperbolic, Deepgram, AssemblyAI, NanoBanana, Chutes AI.
28. API Key Compatible Providers: "Add Anthropic Compatible" and "Add OpenAI Compatible" buttons (form: name, base URL, key, model list, capability tags). Saved entries as cards.
29. Provider card: logo, name, status line green pill "N Connected" or muted "No connections". OAuth cards enable/disable toggle. Connected cards green glowing border. Click -> drawer: connections list (add/remove/rename), per-connection status, priority, last error, quota/rate-limit info, Test button, models list.
30. Badge counts = providers in section with >=1 active connection.
31. Endpoint page: base URL(s), copy buttons, dashboard-managed router API keys (create/revoke), client snippets, remote (tunnel) status.
32. Proxy Pools page: outbound HTTP/SOCKS proxies, assign to providers/accounts, health check, rotation.
33. Combos page: visual editor fallback chains drag-and-drop tiers, strategy (priority_fallback, round_robin), per-tier trigger conditions, test run. Appears as model name to clients.
34. Usage page: requests, tokens in/out, RTK savings, cost per 1M native vs after RTK, by provider/model/client/time range, CSV export.
35. Quota Tracker page: per account 5-hour rolling window, daily/monthly limits, reset countdown, status.
36. MITM page: OPT-IN local only, consent screen, locally generated root cert installed by user (never silent), per-host allowlist, one-click uninstall/revoke. Off by default.
37. CLI Tools page: detect installed clients, generate/apply config (backup first, diff preview, undo) for Claude Code, Cursor, Cline, Codex, OpenClaw.
38. Console Log page: live stream (SSE), level filter, search, secrets masked.
39. Settings page: port, bind address, auth, password change, language, theme, RTK options, fallback options, cloud sync, data export/import (secrets excluded unless user encrypts export), update check.

## 4. Gateway API
40. POST /v1/chat/completions (OpenAI).
41. POST /v1/messages (Anthropic).
42. POST /v1/responses (OpenAI Responses).
43. GET /v1/models (providers' models + combos).
44. Full streaming (SSE) incl. tool calls, correct passthrough of usage.
45. Universal Format Translator: convert between OpenAI, Anthropic, Gemini, OpenAI Responses (and Ollama/Cursor/Kiro/Vertex/Antigravity where applicable) via one internal canonical format. Golden-file tests per pair.
46. Model id format: <provider-prefix>/<model-id> or combo name.
47. Client API key to router is local key managed in dashboard. Upstream credentials never reach clients.

## 5. Routing & Failover
48. Combo = ordered tiers. Tier1 subscription/primary -> Tier2 low-cost -> Tier3 free/credit overflow. Each tier may have several accounts.
49. 429/quota exhausted: rotate next account same provider (round-robin or priority), then next tier. Honor Retry-After; cooldown account.
50. 5xx/timeout/network: retry once max, circuit breaker for account/provider (half-open probe after configurable delay), move next tier.
51. 401/token expired: refresh OAuth token proactively before expiry and reactively once on 401. Never interrupt running client session; show problem in dashboard.
52. Mid-stream failure: if no bytes sent to client, fail over transparently; if stream started, send proper error event.
53. All tiers exhausted: clear client-compatible error (429/503) body listing what was tried (no secrets) + soonest reset time; dashboard alert.
54. Validation: warn (not block) if no Tier-3 free/credit fallback; record whether each model verified. "Never halts" best-effort.

## 6. RTK
55. Cut tokens from repetitive tool_result content in agent loops; measurable savings.
56. Operates on tool_result/tool-role messages only; never system prompt, latest user message, or code model must edit verbatim.
57. Techniques (toggleable): strip ANSI/progress bars, collapse repeated lines (×N), dedupe identical results present earlier, trim long logs head+tail+error lines, compact git diff/ls/npm noise, cap result size with marker [... N lines omitted by RTK ...].
58. On/off switch in Settings + per-combo override. Default ON; warn when disabling for agent clients.
59. Measure real savings (tokens before/after) display in Usage. No fixed claimed percentage. 20-40% target to benchmark not to print.
60. Benchmark fixtures and tests proving no loss of error messages or file paths.

## 7. Security
61. Bind 127.0.0.1 by default. Binding other address or remote requires auth enabled.
62. Dashboard login (password first run, argon2/scrypt, session cookies HttpOnly+SameSite=Strict, CSRF, login rate limiting). Logout works.
63. Secrets encrypted at rest, never returned by API after save (only masked sk-...abcd), never in logs/errors/usage. Log scrubber with tests (Authorization, x-api-key, cookies, OAuth tokens, query-string keys).
64. Strict CORS (allowlist), no wildcard with credentials. SSRF protection in custom-provider URLs (block link-local/metadata ranges unless explicitly allowed).
65. Remote access: Cloudflare Tunnel or custom domain with TLS only. Reject plain HTTP for non-localhost.
66. Upstream telemetry: none. No analytics. Update check opt-in.
67. One-time notice: using subscription OAuth accounts through router / rotating many accounts to bypass limits may violate providers' ToS; user responsible.

## 8. Environment Variables
68. Server runtime reads first; client-exposed NEXT_PUBLIC_* only fallbacks.
69. PORT=20128, BASE_URL=http://localhost:20128, CLOUD_URL optional, SYNC_TIMEOUT_MS=1500.
70. DATA_DIR=~/.3evo.
71. Cloud sync never blocks UI: on timeout/DNS failure keep serving local config + show "sync offline" badge.

## 9. i18n (EN+FA)
72. All UI strings in locales/en.json and locales/fa.json; no hardcoded text.
73. Persian mode: dir="rtl", mirrored layout via logical CSS properties, Vazirmatn font, Persian digits optional in settings.
74. Code, URLs, env vars, model ids, commands always render in dir="ltr" blocks (<bdi>/<code dir="ltr">) even in RTL, with isolated copy buttons.
75. Docs: README.md (EN) and README.fa.md (FA, natural technical Persian, LTR code blocks separated from Persian paragraphs).

## 10. Combo Schema
76. Schema as specified (id,name,description,strategy,rtk,timeoutSeconds,tiers).
77. Validate with JSON Schema in API and UI.
78. 3 built-in templates: premium-coding, budget-coding, free-combo.

## 11. Build Phases
79. Phase 1 Foundation: repo, CLI, config/vault, auth, dashboard shell sidebar/topbar, theme + EN/FA i18n. Done when: 3evo-router starts on 20128, login works, language/theme switch works, Shutdown stops process.
80. Phase 2 Providers: registry, all cards, API-key + compatible, OAuth connect flows, Test/Test All. Done when: adding key marks card "1 Connected" and Test returns real result.
81. Phase 3 Gateway+translator: 4 endpoints, streaming, tool calls. Done when: OpenAI SDK and Anthropic SDK both complete streamed chat through one provider.
82. Phase 4 Routing: account rotation, failover, circuit breaker, combos page. Done when: simulated 429/5xx/timeout walk chain.
83. Phase 5 RTK + Usage + Quota Tracker. Done when: Usage shows real before/after token counts on recorded agent session fixture.
84. Phase 6 Proxy Pools, CLI Tools, Console Log, MITM (opt-in), Settings, remote/tunnel docs.
85. Phase 7 Hardening & docs: security checklist, log-scrubber tests, e2e smoke (Playwright), README.md + README.fa.md, docs/ASSUMPTIONS.md, docs/CLIENTS.md.

## 12. Pre-Delivery Checklist
86. No secret in logs, UI, API responses, git history, test snapshots.
87. Default bind 127.0.0.1, auth enabled.
88. Every provider card in section 3 exists and opens drawer.
89. Failover table behaviors covered by tests.
90. RTK never alters system prompt/latest user message; savings measured.
91. Combos warn when no free fallback.
92. EN and FA complete; RTL verified; code blocks LTR.
93. Cloud sync timeout doesn't freeze UI.
94. npm test and e2e smoke pass; README EN+FA accurate.

## 13. Final Report Format
95. Final report: (1) built per phase, (2) how to run, (3) test results, (4) assumptions & gaps, (5) short Persian summary with steps/clients. Commands/URLs in separate LTR code blocks.

## Assumptions (unclear items)
A1. No reference screenshot provided; UI built from textual spec only.
A2. OAuth providers: implement real OAuth where feasible; for providers without public OAuth endpoints, implement device-code/API-key fallback and mark verified:false.
A3. MITM: implemented as opt-in stub with consent + cert generation hooks; full traffic interception deferred (security-sensitive).
A4. Cloud sync endpoint optional; local-first default.
A5. "npm test" uses vitest; e2e uses Playwright (optional install).
A6. Next.js version: latest stable (15/16) with App Router.
A7. Database path: ~/.3evo/data.db (Windows: %USERPROFILE%/.3evo).
A8. Provider logos: text initials placeholders (no external CDN) to avoid network deps; can be replaced.
A9. Combos templates include 3 built-ins.
A10. Model names/prices loaded from data/providers.json (static seed, verified:false until live check).
