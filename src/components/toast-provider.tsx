"use client";
import { useEffect, useState } from "react";

type Toast = { id: number; message: string; type?: "success" | "error" | "info" };
let globalAdd: ((t: Toast) => void) | null = null;

export function toast(message: string, type: Toast["type"] = "info") {
  if (!globalAdd) return;
  globalAdd({ id: Date.now(), message, type });
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    globalAdd = (t) => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 3000);
    };
    return () => { globalAdd = null; };
  }, []);

  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`rounded-xl border px-4 py-2 text-sm shadow-lg ${
            t.type === "error" ? "border-red-500/40 bg-red-500/10 text-red-300" :
            t.type === "success" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" :
            "border-white/10 bg-white/5 text-gray-200"
          }`}>{t.message}</div>
        ))}
      </div>
    </>
  );
}
