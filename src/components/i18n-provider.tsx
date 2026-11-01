"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { loadLocales, setLocale as setI18nLocale, getLocale, t, dicts } from "@/lib/i18n";

type I18nContextType = {
  locale: string;
  setLocale: (l: string) => void;
  t: (key: string) => string;
  isRTL: boolean;
};

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
  isRTL: false,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState(getLocale());

  useEffect(() => {
    loadLocales();
  }, []);

  const setLocale = (l: string) => {
    setI18nLocale(l);
    setLocaleState(l);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: (key) => t(key), isRTL: locale === "fa" }}>
      <div dir={locale === "fa" ? "rtl" : "ltr"} className={locale === "fa" ? "font-fa" : ""}>
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
