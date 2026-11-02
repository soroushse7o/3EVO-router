# 3EVO Router — گیت‌وی هوشمند هوش مصنوعی (لوکال + داشبورد تحت وب)

یک endpoint واحد و سازگار با OpenAI/Anthropic ارائه می‌دهد و درخواست‌ها را بین چند provider با failover و رمزنگاری کلیدها مسیریابی می‌کند.

> **وضعیت: آلفا — آماده تولید نیست.** جدول [وضعیت ویژگی‌ها](#وضعیت-ویژگی‌ها) واقعیت را نشان می‌دهد.

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
| API key generation/validation | Working | `src/lib/api-key.ts` |
| Vault encrypt/decrypt | Working | `src/lib/vault.ts` |
| Scrubber | Working | `src/lib/scrubber.ts` |
| Usage logging (SQLite) | Working | `src/lib/db.ts`; aggregates کامل |
| Circuit breaker | Working | `src/lib/circuit.ts`; in-memory, per-provider |
| 3-tier failover | Working | `src/lib/router.ts`; چند tier واقعی |
| Provider pricing | Working | `price_per_1k_in/out` در SQLite |
| Rate limiting | Working | `src/lib/rateLimit.ts`; 120 req/min |
| Metrics endpoint | Working | `src/app/api/metrics/route.ts` |
| Structured logs + request IDs | Working | `src/lib/logger.ts`, `src/lib/reqId.ts` |
| Persian/RTL locales | Partial | `locales/fa.json`; UI منوی ساده |
| SSE streaming | Working | `src/lib/streamController.js` |
| Trusted peer headers | Planned | `src/lib/auth/trustedPeer.js` |

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

- **Storage**: SQLite (`better-sqlite3` با `sql.js` fallback) در `~/.3evo/`.
- **Secrets**: AES-256-GCM، کلید در فایل محلی `~/.3evo/master.key`.
- **Port**: `20128` به طور پیش‌فرض.
- **Node**: >= 18.

## امنیت

- bind پیش‌فرض روی `127.0.0.1` در اسکریپت‌ها.
- رمز پیش‌فرض: `123456789` (تغییر دهید در Settings).
- Dashboard auth: cookie-based session با scrypt password hashing.
- Session validation در route handlerها؛ proxy Node.js runtime است.
- Log scrubber: رازهای حساس پاک می‌شوند.
- Secrets در vault رمزنگاری‌شده ذخیره می‌شوند.
- CSRF token پیاده‌سازی شده.
- Rate limiting: 120 درخواست در دقیقه برای هر API key.
- محافظت SSRF: رنج‌های خصوصی مسدود شده‌اند.
- CORS strict allowlist پیکربندی شده.
- یکپارچگی OS keychain برای v2 برنامه‌ریزی شده.

## رمز پنل مدیریت

مقدار پیش‌فرض: `123456789`

اگر رمز را فراموش کردید:
1. `~/.3evo/data.db` را حذف یا جدول `auth` را پاک کنید
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
│   │   ├ endpoint/page.tsx
│   │   ├ providers/page.tsx
│   │   ├ settings/page.tsx
│   │   ├ usage/page.tsx
│   │   └ layout.tsx
│   └ api/
│       ├ auth/route.ts
│       ├ auth/reset/route.ts
│       ├ health/route.ts
│       ├ log/route.ts
│       ├ metrics/route.ts
│       ├ settings/route.ts
│       ├ usage/route.ts
│       ├ api-keys/route.ts
│       ├ providers/route.ts
│       ├ route/test/route.ts
│       └ v1/
│           ├ chat/completions/route.ts
│           ├ messages/route.ts
│           ├ models/route.ts
│           └ responses/route.ts
├ components/
│   ├ i18n-provider.tsx
│   ├ language-toggle.tsx
│   └ toast-provider.tsx
├ data/
│   └ providers.json
└ lib/
    ├ auth.ts                # scrypt auth، session management
    ├ api-key.ts             # API key generation/validation
    ├ vault.ts               # AES-256-GCM encryption
    ├ router.ts              # failover + streaming
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
    ├ auth/
    │   └ dashboardSession.js # HS256 JWT sessions
    ├ db/
    │   ├ driver.js           # multi-adapter SQLite
    │   ├ adapters/           # better-sqlite3, node:sqlite, sql.js, bun:sqlite
    │   ├ helpers/nullBytes.js
    │   ├ paths.js
    │   ├ migrate.js
    │   ├ migrations/schema.sql
    │   └ repos/
    │       ├ apiKeysRepo.js
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
