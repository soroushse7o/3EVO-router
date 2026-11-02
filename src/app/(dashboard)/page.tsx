"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardIndex() {
  const [hasKey, setHasKey] = useState(false);
  const [hasProvider, setHasProvider] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/api-keys").then(r => r.json()),
      fetch("/api/providers").then(r => r.json()),
    ])
      .then(([keys, providers]) => {
        setHasKey(Array.isArray(keys) && keys.length > 0);
        setHasProvider(Array.isArray(providers) && providers.length > 0);
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);

  const onboardingDone = hasKey && hasProvider;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5" aria-label="Onboarding">
        <h2 className="text-lg font-semibold mb-3">Getting started</h2>
        <ol className="space-y-2 text-sm">
          <li className={`flex items-center gap-2 ${hasKey ? "text-emerald-300" : "text-gray-300"}`}>
            <span aria-hidden>{hasKey ? "✅" : "⬜"}</span>
            <span>Create an API key in Settings.</span>
            {!hasKey && <Link href="/settings" className="ml-auto text-xs underline underline-offset-2">Go to Settings</Link>}
          </li>
          <li className={`flex items-center gap-2 ${hasProvider ? "text-emerald-300" : "text-gray-300"}`}>
            <span aria-hidden>{hasProvider ? "✅" : "⬜"}</span>
            <span>Add at least one provider.</span>
            {!hasProvider && <Link href="/providers" className="ml-auto text-xs underline underline-offset-2">Add provider</Link>}
          </li>
          <li className={`flex items-center gap-2 ${onboardingDone ? "text-emerald-300" : "text-gray-300"}`}>
            <span aria-hidden>{onboardingDone ? "✅" : "⬜"}</span>
            <span>Call <code className="text-xs bg-black/30 px-1 py-0.5 rounded">/v1/chat/completions</code> with your key.</span>
          </li>
        </ol>
        {checked && !onboardingDone && (
          <p className="mt-3 text-xs text-gray-400">Finish the checklist above to make your first request.</p>
        )}
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Endpoint", "/endpoint", "Base URL and copy snippet"],
          ["Providers", "/providers", "Add/edit/test providers"],
          ["Usage", "/usage", "Upstream usage and CSV export"],
          ["Settings", "/settings", "API keys and preferences"],
        ].map(([label, href, hint]) => (
          <Link key={href} href={href} className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/40">
            <div className="font-medium">{label}</div>
            <div className="text-xs text-gray-400 mt-1">{hint}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
