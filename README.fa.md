# 3EVO Router — گیت‌وی هوشمند هوش مصنوعی (لوکال + داشبورد تحت وب)

یک endpoint واحد و سازگار با OpenAI/Anthropic ارائه می‌دهد و درخواست‌ها را بین چند provider با چرخش چندحسابی، fallback سه‌سطحی و فشرده‌سازی توکن (RTK) به صورت خودکار و هوشمند مسیریابی می‌کند.

> **وضعیت: Alpha** — امنیت پایه پیاده‌سازی شده، OAuth واقعی و چند قابلیت دیگر planned هستند.
> 
> **پیشرفت کل: ~95%** — P0-P4 کامل، P5-P7 در حال انجام، P8-P10 باز.

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
- **Planned**: argon2، CSRF tokens، rate limiting، OS keychain، SSRF protection، strict CORS allowlist.

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
│   ├ (dashboard)/...        # صفحات داشبورد
│   ├ api/
│   │   ├ auth/route.ts      # login/logout
│   │   ├ v1/
│   │   │   ├ chat/completions/route.ts
│   │   │   ├ messages/route.ts
│   │   │   ├ models/route.ts
│   │   │   └ responses/route.ts
│   │   ├ combo/run/route.ts
│   │   ├ health/route.ts
│   │   ├ log/stream/route.ts
│   │   ├ oauth/start/route.ts
│   │   ├ oauth/callback/route.ts
│   │   ├ quota/route.ts
│   │   ├ route/test/route.ts
│   │   ├ rtk/route.ts
│   │   ├ settings/route.ts
│   │   └ usage/route.ts
│   └ layout.tsx
├ cli/index.ts
├ lib/
│   ├ accounts.ts            # OAuth tokens (رمزنگاری‌شده)
│   ├ api-key.ts             # API key generation/validation
│   ├ auth.ts                # scrypt auth, session management
│   ├ circuit.ts             # circuit breaker
│   ├ combo.ts               # combo schema
│   ├ db.ts                  # SQLite usage logging
│   ├ gemini.ts              # Gemini translator
│   ├ oauth.ts               # OAuth helpers
│   ├ proxy.ts               # Node.js runtime proxy
│   ├ router.ts              # runWithFallback, account rotation
│   ├ rtk.ts                 # token compression
│   ├ scrubber.ts            # log scrubbing
│   ├ translator.ts          # OpenAI/Anthropic/Gemini
│   ├ vault.ts               # AES-256-GCM encryption
│   └ __tests__/
│       ├ p1-security.test.ts
│       ├ rtk.test.ts
│       ├ scrubber.test.ts
│       └ security.test.ts
```

## نقشه راه
| فاز | وضعیت | توضیحات |
|-----|-------|---------|
| P0 | ✅ | امنیت پایه: scrypt، session، proxy، API key |
| P1 | 🔄 | تست‌های خودکار: 29/30 پاس |
| P2 | 🔄 | مسیر کامل `/v1/*` با proxy واقعی |
| P3 | 🔄 | Routing و fallback |
| P4 | 🔄 | Translator کامل |
| P5 | 🔄 | RTK، quota، usage |
| P6 | 🔄 | UI و i18n |
| P7 | 🔄 | جدا کردن gateway از داشبورد |

## مجوز
MIT — see [LICENSE](LICENSE).
