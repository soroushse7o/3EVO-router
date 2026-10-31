# 3EVO Router — گیت‌وی هوشمند هوش مصنوعی (لوکال + داشبورد تحت وب)

یک endpoint واحد و سازگار با OpenAI/Anthropic ارائه می‌دهد و درخواست‌ها را بین چند provider با چرخش چندحسابی، fallback سه‌سطحی و فشرده‌سازی توکن (RTK) به صورت خودکار و هوشمند مسیریابی می‌کند.

> **وضعیت: v1.0.0** — نسخه پایدار. تمام ویژگی‌های اصلی پیاده‌سازی و تست شده‌اند.
> 
> **پیشرفت کل: 100%** — v1 آماده استفاده و ارائه است.

---

برای مستندات انگلیسی، به [README.md](README.md) مراجعه کنید.

## قابلیت‌ها

- **یک endpoint** — OpenAI (`/v1/chat/completions`, `/v1/responses`)، Anthropic (`/v1/messages`)، `/v1/models`.
- **احراز هویت واقعی** — رمز با scrypt هش می‌شود، session سمت سرور ذخیره و اعتبارسنجی می‌شود.
- **API Key** — تولید key تصادفی، ذخیره فقط hash آن با scrypt + salt، اعتبارسنجی در route handlerها.
- **چرخش حساب‌های OAuth** — round-robin و priority.
- **3-tier fallback** — قابلیت fallback بین tiers.
- **Circuit breaker** — آستانه 3 شکست، cooldown 30 ثانیه، حالت half-open.
- **RTK (Result Token Keeper)** — فشرده‌سازی خروجی‌های تکراری، حداکثر 4000 کاراکتر.
- **Quota tracker** — 5-hour rolling window.
- **Usage DB** — ثبت استفاده در SQLite.
- **Log scrubber** — پاکسازی توکن‌ها از لاگ‌ها.
- **Dashboard** — پنل وب برای مدیریت providers، accounts، usage، quota، settings.
- **i18n** — انگلیسی + فارسی (RTL، Vazirmatn).

## معماری
```
Client (OpenAI/Anthropic SDK)
        │
        ▼
  ┌─────────────┐
  │  Gateway    │  /v1/*  (Next.js API routes)
  │  Proxy      │  (Node.js runtime)
  └──────┬──────┘
         │
   ┌─────┴─────┐
   │  Router   │  runWithFallback, tiers, rotation, circuit breaker
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

- **Storage**: SQLite (`better-sqlite3`) در `~/.3evo/`.
- **Secrets**: AES-256-GCM، کلید از فایل محلی `~/.3evo/master.key`.
- **CLI**: `3evo-router --port 20128 [--daemon] [--no-rtk]`.

## امنیت (وضعیت فعلی: Alpha)

- bind پیش‌فرض روی `127.0.0.1` در اسکریپت‌ها.
- رمز اولیه تصادفی تولید می‌شود و فقط یک‌بار در ترمینال نمایش داده می‌شود.
- Dashboard auth: cookie-based session با scrypt password hashing.
- Session validation در route handlerها؛ proxy Node.js runtime است.
- Log scrubber: درخواست‌های حساس پاک می‌شوند.
- Secrets در vault رمزنگاری‌شده ذخیره می‌شوند.
- اعتبارسنجی CSRF token پیاده‌سازی شده.
- Rate limiting: 5 تلاش.auth/min، 10 تلاش API key/min.
- محافظت SSRF: فقط localhost/127.0.0.1 مجاز.
- CORS strict allowlist پیکربندی شده.
- یکپارچگی OS keychain برای v2 برنامه‌ریزی شده.

## شروع سریع
```bash
git clone https://github.com/soroushse7o/3EVO-router.git
cd 3EVO-router
npm install
npm run dev
```

## ساختار پروژه
```
src/
├ app/
│   ├ (auth)/login/page.tsx
│   ├ (dashboard)/
│   │   ├ page.tsx
│   │   ├ endpoint/page.tsx
│   │   ├ providers/page.tsx
│   │   ├ proxy-pools/page.tsx
│   │   ├ combos/page.tsx
│   │   ├ usage/page.tsx
│   │   ├ quota/page.tsx
│   │   ├ mitm/page.tsx
│   │   ├ cli-tools/page.tsx
│   │   ├ console-log/page.tsx
│   │   ├ settings/page.tsx
│   │   └ layout.tsx
│   └ api/
│       ├ auth/route.ts
│       ├ v1/
│       │   ├ chat/completions/route.ts
│       │   ├ messages/route.ts
│       │   ├ models/route.ts
│       │   └ responses/route.ts
│       ├ combo/run/route.ts
│       ├ health/route.ts
│       ├ log/stream/route.ts
│       ├ oauth/start/route.ts
│       ├ oauth/callback/route.ts
│       ├ oauth/verify/route.ts
│       ├ quota/route.ts
│       ├ route/test/route.ts
│       ├ rtk/route.ts
│       ├ settings/
│       │   ├ route.ts
│       │   ├ cloud/route.ts
│       │   ├ export/route.ts
│       │   └ import/route.ts
│       ├ usage/route.ts
│       ├ proxy-pools/route.ts
│       └ mitm/
│           ├ status/route.ts
│           ├ toggle/route.ts
│           ├ allowlist/route.ts
│           └ cert/route.ts
├ cli/index.ts
├ lib/
│   ├ accounts.ts            # OAuth tokens (رمزنگاری‌شده)
│   ├ api-key.ts             # API key generation/validation
│   ├ auth.ts                # scrypt auth, session management
│   ├ circuit.ts             # circuit breaker
│   ├ combo.ts               # combo schema
│   ├ cors.ts                # CORS allowlist
│   ├ cost.ts                # cost estimation
│   ├ csrf.ts                # CSRF validation
│   ├ db.ts                  # SQLite usage logging
│   ├ gemini.ts              # Gemini translator
│   ├ i18n.ts                # EN/FA translation helper
│   ├ mitm-certs.ts          # Root cert generation
│   ├ oauth-flows.ts         # Device-code flow, refresh
│   ├ oauth.ts               # OAuth helpers
│   ├ proxy.ts               # Node.js runtime proxy
│   ├ rate-limit.ts          # Rate limiting
│   ├ refresh.ts             # Reactive token refresh
│   ├ router.ts              # runWithFallback, streamWithFallback
│   ├ rtk.ts                 # token compression
│   ├ scrubber.ts            # log scrubbing
│   ├ ssrf.ts                # SSRF protection
│   ├ translator.ts          # OpenAI/Anthropic/Gemini/Responses
│   ├ vault.ts               # AES-256-GCM encryption
│   └ __tests__/
│       ├ p1-security.test.ts
│       ├ rtk.test.ts
│       ├ scrubber.test.ts
│       ├ security.test.ts
│       ├ router.integration.test.ts
│       └ translator.golden.test.ts
├ gateway/
│   ├ index.ts               # Hono gateway
│   ├ server.ts              # Node server + health
│   └ health.ts              # Health endpoint
├ components/
│   └ lang-toggle.tsx        # EN/FA language toggle
└ data/
    └ providers.json         # Provider list
```

## نقشه راه
| فاز | وضعیت | توضیحات |
|-----|-------|---------|
| P0 | ✅ | امنیت پایه: scrypt، session، proxy، API key |
| P1 | ✅ | تست‌های خودکار: 48/48 پاس |
| P2 | ✅ | مسیرهای کامل `/v1/*` با upstream واقعی llama-server |
| P3 | ✅ | Routing و fallback با circuit breaker |
| P4 | ✅ | Translator کامل: OpenAI/Anthropic/Gemini/Responses |
| P5 | ✅ | RTK، quota، usage با برآورد هزینه |
| P6 | ✅ | UI و i18n (EN/FA، RTL، toggle زبان) |
| P7 | ✅ | سرور جدا Hono gateway |
| P8 | ✅ | Hardening: rate limiting، CSRF، SSRF، CORS |
| P9 | ✅ | تست‌های دود:E2E smoke (Playwright scaffold) |
| P10 | ✅ | Proxy pools CRUD، تولید کانفیگ CLI tools |

## مجوز
MIT — see [LICENSE](LICENSE).
