# 3EVO Router

گیت‌وی هوش مصنوعی لوکال + داشبورد وب («Endpoint Proxy»). یک endpoint سازگار با OpenAI/Anthropic ارائه می‌دهد و درخواست‌ها را بین چند provider با چرخش چندحسابی، fallback سه‌سطحی و فشرده‌سازی توکن (RTK) مسیریابی می‌کند.

## شروع سریع
```
npm install
npm run dev
```
باز کردن http://localhost:20128

## اتصال کلاینت‌ها
```
export OPENAI_BASE_URL="http://localhost:20128/v1"
export OPENAI_API_KEY="<router-key-from-dashboard>"
export ANTHROPIC_BASE_URL="http://localhost:20128"
export ANTHROPIC_AUTH_TOKEN="<router-key-from-dashboard>"
```

## مجوز
MIT
