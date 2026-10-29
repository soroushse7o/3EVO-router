# 3EVO Router — Build Plan

## Phase 1: Foundation
Files: package.json, tsconfig.json, next.config.ts, tailwind.config.ts, src/app/layout.tsx, src/app/(auth)/login/page.tsx, src/app/(dashboard)/layout.tsx, src/lib/db.ts, src/lib/vault.ts, src/lib/auth.ts, src/cli/index.ts, src/i18n/*, locales/en.json, locales/fa.json, docs/ASSUMPTIONS.md
Order: init npm -> tsconfig -> db/vault/auth -> cli -> i18n -> shell UI -> auth flow
Verify: npm run dev on 20128, login works, language/theme switch, shutdown stops.
Closes: 13-23, 61-62, 68-70, 72-74, 79.

## Phase 2: Providers
Files: data/providers.json, src/lib/providers.ts, src/app/(dashboard)/providers/page.tsx, drawer component, OAuth/API-key flows, compatible providers form.
Verify: add key -> card "1 Connected", Test returns real result.
Closes: 24-30, 88.

## Phase 3: Gateway + Translator
Files: src/app/api/v1/*, src/lib/translator/*, streaming handlers.
Verify: OpenAI SDK + Anthropic SDK streamed chat through one provider.
Closes: 40-47, 81.

## Phase 4: Routing
Files: src/lib/router.ts, combos schema, combos page, circuit breaker.
Verify: simulated 429/5xx/timeout walk chain.
Closes: 48-54, 76-78, 82, 89, 91.

## Phase 5: RTK + Usage + Quota
Files: src/lib/rtk.ts, usage tables, quota tracker.
Verify: Usage shows before/after tokens on fixture.
Closes: 55-60, 34-35, 83, 90.

## Phase 6: Proxy Pools, CLI Tools, Console Log, MITM, Settings
Files: respective pages + backend.
Closes: 31-33, 36-39, 84.

## Phase 7: Hardening & Docs
Files: tests/, README.md, README.fa.md, docs/CLIENTS.md, Playwright e2e.
Closes: 10-12, 63-67, 71, 75, 85-87, 92-95.

Start with Phase 1 now.
