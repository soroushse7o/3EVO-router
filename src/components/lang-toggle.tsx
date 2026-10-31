"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LangToggle() {
  const router = useRouter();
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const l = localStorage.getItem("lang") || "en";
    setLang(l);
    document.documentElement.dir = l === "fa" ? "rtl" : "ltr";
    document.documentElement.lang = l;
  }, []);

  const toggle = () => {
    const next = lang === "en" ? "fa" : "en";
    setLang(next);
    localStorage.setItem("lang", next);
    document.documentElement.dir = next === "fa" ? "rtl" : "ltr";
    document.documentElement.lang = next;
    router.refresh();
  };

  return (
    <button onClick={toggle} className="rounded bg-white/10 px-2 py-1 text-xs" aria-label="Toggle language">
      {lang === "en" ? "فارسی" : "EN"}
    </button>
  );
}
