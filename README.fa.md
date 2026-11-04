<p align="center">
  <img src="public/logo.svg" alt="3EVO Router" width="120" height="120" />
</p>

# 3EVO Router — گیت‌وی هوشمند هوش مصنوعی (لوکال + داشبورد تحت وب)

یک endpoint واحد و سازگار با OpenAI/Anthropic ارائه می‌دهد و درخواست‌ها را بین چند provider با failover و رمزنگاری کلیدها مسیریابی می‌کند.

> **وضعیت: پایدار — نسخه ۱.۰.۰ (Stable v1.0.0)** جدول [وضعیت ویژگی‌ها](#وضعیت-ویژگی‌ها) واقعیت را نشان می‌دهد.

---

برای مستندات انگلیسی، به [README.md](README.md) مراجعه کنید.

## وضعیت ویژگی‌ها

| ویژگی | وضعیت | شاهد / فایل |
|--------|--------|-----------------|
| پروکسی `/v1/chat/completions` | Working | `src/app/api/v1/chat/completions/route.ts` |
| پروکسی `/v1/messages` | Working | `src/app/api/v1/messages/route.ts` |
| پروکسی `/v1/responses` | Working | `src/app/api/v1/responses/route.ts` |
| `/v1/models` | Working | `src/app/api/v1/models/route.ts` |
| لاگین داشبورد (scrypt + session) | Working | `src/lib/auth.ts`, `src/app/api/auth/route.ts` |
| بازنشانی رمز | Working | `src/app/api/auth/reset/route.ts` |
| مدیریت API Key | Working | `src/lib/db/repos/apiKeysRepo.js` + UI داشبورد |
| Vault encrypt/decrypt | Working | `src/lib/vault.ts` |
| Multi-tier failover | Working | `src/lib/router.ts`; چند tier واقعی |
| Provider pricing | Working | `price_per_1k_in/out` در SQLite |
| Circuit breaker | Working | `src/lib/circuit.ts`; in-memory, per-provider |
| Rate limiting | Working | `src/lib/rateLimit.ts`; 120 req/min |
| Metrics endpoint | Working | `src/app/api/metrics/route.ts` |
| Structured logs + request IDs | Working | `src/lib/logger.ts`, `src/lib/reqId.ts` |
| Persian/RTL UI | Partial | داشبورد و کامپوننت‌های اصلی |
| SSE streaming | Working | `src/lib/streamController.js` |
| پشتیبانی OAuth | Working | جریان‌های Google، GitHub + مدیریت اتصال |
| بازنشانی خودکار توکن OAuth | Working | refresh خودکار قبل از انقضا |
| چک سلامت اتصال OAuth | Working | هشدار انقضا از طریق `/api/oauth` |
| مرکزی Auth Guard (deny-by-default) | Working | `src/lib/dashboardGuard.ts`, `middleware.ts` |
| Progressive login lockout | Working | `src/lib/loginLimiter.ts` |
| CLI token auth (machine-ID) | Working | `src/lib/cliToken.ts` |
| Provider executor pattern | Working | `src/lib/providers/DefaultExecutor.ts` |
| Trusted peer header validation | Working | `src/lib/auth/trustedPeer.ts` + `middleware.ts` |
| Repository pattern (barrel export) | Working | `src/lib/db/index.ts` |
| Settings management + UI | Working | `src/lib/db/repos/settingsRepo.js` + `/settings` |
| Instrumentation (request timing, provider stats) | Working | `src/lib/instrumentation.ts` + `/api/metrics` |
| Monthly budget limits | Working | `src/lib/budget.ts` + Settings UI |
| Model aliases + fallback chains | Working | `src/lib/db/repos/aliasesRepo.js` + `/aliases` |
| Request details tab | Working | `src/lib/db/repos/requestDetailsRepo.js` + `/request-details` |
| Playwright E2E tests | Partial | `playwright-tests/basic.spec.ts` |
| بسته نصب‌کننده (pkg) | Working | `package.json` scripts + `dist/` |

## معماری

```
Client (OpenAI/Anthropic SDK)
        │
        ▼
  ┌─────────────┐
  │  Next.js    │  /v1/* routes (Node.js runtime)
  │  API routes │
  └──────┬──────┘
         │
   ┌─────┴─────┐
   │  Router   │  failover، circuit breaker، timeouts
   └─────┬─────┘
         │
   ┌─────┴─────────────────────┐
   │ Providers (SQLite + Vault)│  base URL + encrypted API key
   └───────────────────────────┘
```

- **Storage**: SQLite (`better-sqlite3` با `sql.js` fallback) در `DATA_DIR` (پیش‌فرض: `C:/Users/Administrator/3evo-router/data`).
- **Secrets**: AES-256-GCM، کلید در `DATA_DIR/master.key`.
- **Port**: `20128` به طور پیش‌فرض.
- **Node**: >= 22.

## امنیت

- bind پیش‌فرض روی `127.0.0.1` در اسکریپت‌ها.
- رمز پیش‌فرض: `123456789` (تغییر دهید در Settings).
- Dashboard auth: cookie-based session با scrypt password hashing.
- Progressive login lockout: 5 تلاش ناموفق → قفل 30s/120s/600s/1800s.
- CLI token auth: machine-ID-based token برای دسترسی بدون لاگین.
- Trusted peer bypass: هدر `x-3r-peer-token` برای پروکسی‌های محلی.
- Session validation در route handlerها؛ proxy Node.js runtime است.
- Secrets در vault رمزنگاری‌شده ذخیره می‌شوند.
- Rate limiting: 120 درخواست در دقیقه برای هر API key.
- محافظت SSRF: رنج‌های خصوصی مسدود شده‌اند.
- بسته نصب‌کننده تک‌باینری برای Windows/macOS/Linux via `pkg`.

## رمز پنل مدیریت

مقدار پیش‌فرض: `123456789`

اگر رمز را فراموش کردید:
1. `DATA_DIR/data.db` را حذف یا جدول `auth` را پاک کنید
2. سرور را ری‌استارت کنید (رمز پیش‌فرض دوباره نوشته می‌شود)

همچنین می‌توانید پس از ورود به پنل، از بخش Settings رمز را تغییر دهید.

## شروع سریع
```bash
git clone https://github.com/soroushse7o/3EVO-router.git
cd 3EVO-router
npm install
npm run dev
```

## ساختار پروژه (فعلی)

```
src/
├ app/
│   ├ (auth)/login/page.tsx
│   ├ (dashboard)/
│   │   ├ page.tsx
│   │   ├ aliases/page.tsx
│   │   ├ endpoint/page.tsx
│   │   ├ providers/page.tsx
│   │   ├ request-details/page.tsx
│   │   ├ settings/page.tsx
│   │   ├ usage/page.tsx
│   │   └ layout.tsx
│   └ api/
│       ├ aliases/route.ts
│       ├ aliases/[id]/route.ts
│       ├ api-keys/route.ts
│       ├ api-keys/[id]/route.ts
│       ├ auth/route.ts
│       ├ auth/reset/route.ts
│       ├ health/route.ts
│       ├ log/route.ts
│       ├ metrics/route.ts
│       ├ oauth/route.ts
│       ├ oauth/connections/[id]/route.ts
│       ├ providers/route.ts
│       ├ providers/[id]/route.ts
│       ├ request-details/route.ts
│       ├ route/test/route.ts
│       ├ settings/route.ts
│       ├ usage/route.ts
│       └ v1/
│           ├ chat/completions/route.ts
│           ├ messages/route.ts
│           ├ models/route.ts
│           └ responses/route.ts
└ lib/
    ├ auth.ts                # scrypt auth، session management
    ├ api-key.ts             # API key generation/validation
    ├ vault.ts               # AES-256-GCM encryption
    ├ router.ts              # failover + streaming + aliases
    ├ circuit.ts             # circuit breaker
    ├ ssrf.ts                # SSRF protection
    ├ scrubber.ts            # log scrubbing
    ├ logger.ts              # structured logs
    ├ reqId.ts               # request IDs
    ├ rateLimit.ts           # per-key rate limiting
    ├ streamController.js    # SSE disconnect cleanup
    ├ translator.ts          # OpenAI/Anthropic format translator
    ├ i18n.ts                # EN/FA translation helper
    ├ paths.ts               # DATA_DIR paths
    ├ db.ts                  # SQLite back-compat accessor
    ├ dashboardGuard.ts      # deny-by-default auth guard
    ├ loginLimiter.ts        # progressive login lockout
    ├ cliToken.ts            # machine-ID CLI token auth
    ├ instrumentation.ts     # request timing + provider/route stats
    ├ budget.ts              # monthly budget enforcement
    ├ providers/
    │   ├ DefaultExecutor.ts # standardized provider execution
    │   └ index.ts
    ├ auth/
    │   ├ trustedPeer.ts     # trusted peer header validation
    │   └ dashboardSession.js # HS256 JWT sessions
    ├ db/
    │   ├ driver.js           # multi-adapter SQLite
    │   ├ adapters/           # better-sqlite3, node:sqlite, sql.js, bun:sqlite
    │   ├ helpers/nullBytes.js
    │   ├ paths.js
    │   ├ migrate.js
    │   ├ migrations/schema.sql
    │   ├ index.ts            # barrel export for all repos
    │   └ repos/
    │       ├ aliasesRepo.js
    │       ├ apiKeysRepo.js
    │       ├ authRepo.js
    │       ├ lockoutRepo.js
    │       ├ providersRepo.js
    │       ├ requestDetailsRepo.js
    │       ├ sessionsRepo.js
    │       ├ settingsRepo.js
    │       └ usageRepo.js
    └ __tests__/
        ├ p1-security.test.ts
        ├ security.test.ts
        ├ router.integration.test.ts
        ├ e2e-fallback.test.ts
        ├ scrubber.test.ts
        └ translator.golden.test.ts
```

## مجوز
MIT — see [LICENSE](LICENSE).
