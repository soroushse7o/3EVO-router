# 3EVO Router — گیت‌وی هوشمند هوش مصنوعی (لوکال + داشبورد تحت وب)

یک endpoint واحد و سازگار با OpenAI/Anthropic ارائه می‌دهد و درخواست‌ها را بین چند provider با چرخش چندحسابی، fallback سه‌سطحی و فشرده‌سازی توکن (RTK) به صورت خودکار و هوشمند مسیریابی می‌کند.

> **وضعیت: آلفا — آماده تولید نیست.** بسیاری از ویژگی‌های اعلام شده در واقع stub، شبیه‌سازی یا کد مرده هستند. جدول [وضعیت ویژگی‌ها](#وضعیت-ویژگی‌ها) واقعیت را نشان می‌دهد.

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
| API key generation/validation | Working | `src/lib/api-key.ts` |
| Vault encrypt/decrypt | Working | `src/lib/vault.ts` |
| Scrubber (الگوهای پایه) | Working | `src/lib/scrubber.ts` |
| لاگین استفاده (SQLite) | Stub | `src/lib/db.ts`; aggregates محدود |
| Quota tracker | Stub | `src/app/api/quota/route.ts`; پنجره 5h هاردکد |
| RTK token compression | Stub | `src/lib/rtk.ts`; همیشه 0 ذخیره را گزارش می‌دهد |
| Circuit breaker | Stub | `src/lib/circuit.ts`; in-memory, بدون پایداری |
| 3-tier failover | Stub | `src/lib/router.ts`; فقط یک tier در `/v1/chat/completions` |
| Account rotation | Stub | `src/lib/router.ts`; بدون state پایداری |
| OAuth device-code flow | Simulated | `src/lib/oauth-flows.ts`; token ساختگی |
| Provider adapters (Ollama/Cursor/etc.) | Cosmetic | `src/lib/translator.ts`; فقط نام مدل تغییر می‌کند |
| Combos page | Static UI | `src/app/(dashboard)/combos/page.tsx`; 3 کارت ثابت |
| Providers page | Static UI | `src/app/(dashboard)/providers/page.tsx` |
| Proxy pools CRUD | Working | `src/app/api/proxy-pools`; در outbound استفاده نمی‌شود |
| MITM | Experimental | `src/app/api/mitm/*`; بدون اعتراض واقعی |
| CLI tools config generation | Stub | `src/app/(dashboard)/cli-tools/page.tsx` |
| Console log | Stub | `src/app/(dashboard)/console-log/page.tsx` |
| i18n EN/FA + RTL | Working | `src/lib/i18n.ts`, static `docs/panel.html` |
| Hono gateway server | Dead code | `src/gateway/index.ts`; توسط هیچ route import نمی‌شود |
| CORS/CSRF/SSRF/rate-limit | Partial | در بعضی routes وجود دارد، ناسازگار |

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

## رمز پنل مدیریت

مقدار `ADMIN_PASSWORD` را در فایل `.env` قبل از اجرای اول تنظیم کنید. اگر این متغیر خالی باشد، یک رمز تصادفی در اولین اجرا در ترمینال نمایش داده شده و در `~/.3evo/auth.json` ذخیره می‌شود.

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

## نقشه راه (واقعی)

| فاز | وضعیت | توضیحات |
|-----|--------|---------|
| P0 | ✅ | صادقیت پایه: docs مطابق کد، رازهای هاردکد حذف شد |
| P1 | 🔄 | امنیت: S1–S15 (در حال انجام) |
| P2 | ⏳ | هسته مسیریابی واقعی: multi-tier، circuit breaker، timeouts |
| P3 | ⏳ | اصلاح Translator & streaming |
| P4 | ⏳ | providers/OAuth واقعی یا حذف صادقانه |
| P5 | ⏳ | اصلاح Usage/quota/RTK |
| P6 | ⏳ | UI/i18n/CLI/tests |

## مجوز
MIT — see [LICENSE](LICENSE).
