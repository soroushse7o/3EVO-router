# 3EVO Router (Endpoint Proxy)

گیت‌وی هوش مصنوعی لوکال + داشبورد وب. یک endpoint سازگار با OpenAI/Anthropic ارائه می‌دهد و درخواست‌ها را بین چند provider با چرخش چندحسابی، fallback سه‌سطحی و فشرده‌سازی توکن (RTK) مسیریابی می‌کند.

## شروع سریع
```bash
npm install
cp .env.example .env   # اختیاری
npm run dev
```
پنل: `http://localhost:20128/` (یا `http://localhost:20128/<SECRET_PATH>` اگر تنظیم شده)

## متغیرهای محیطی
```
PORT=20128
BASE_URL=http://localhost:20128
SECRET_PATH=                # مسیر مخفی ۱۶-۳۲ کاراکتری برای پنل
DATA_DIR=~/.3evo
CLOUD_URL=                 # endpoint اختیاری sync
SYNC_TIMEOUT_MS=1500
```

## اتصال کلاینت‌ها
```bash
export OPENAI_BASE_URL="http://localhost:20128/v1"
export OPENAI_API_KEY="<router-key-from-dashboard>"
export ANTHROPIC_BASE_URL="http://localhost:20128"
export ANTHROPIC_AUTH_TOKEN="<router-key-from-dashboard>"
```

## نکات امنیتی
- پیش‌فرض bind روی 127.0.0.1. اتصال ریموت نیازمند auth است.
- با `SECRET_PATH` پنل را پشت یک مسیر مخفی قرار بده.
- اسرار رمزنگاری‌شده در حالت rest (AES-256-GCM) و هرگز بعد از ذخیره برگردانده نمی‌شوند.
- Cloud sync هرگز UI را بلوکه نمی‌کند.

## مجوز
MIT
