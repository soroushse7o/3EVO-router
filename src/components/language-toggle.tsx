"use client";
import { useI18n } from "./i18n-provider";

export default function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  return (
    <button
      onClick={() => setLocale(locale === "en" ? "fa" : "en")}
      className="text-xs rounded px-2 py-1 bg-white/10 hover:bg-white/20"
    >
      {locale === "en" ? "فارسی" : "English"}
    </button>
  );
}
