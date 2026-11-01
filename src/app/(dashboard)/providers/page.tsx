"use client";
import { useState } from "react";
import providers from "@/data/providers.json";
import { useI18n } from "@/components/i18n-provider";

export default function ProvidersPage() {
  const { t } = useI18n();
  const [custom, setCustom] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [form, setForm] = useState({ name: "", baseUrl: "", apiKey: "", model: "gpt-3.5-turbo" });

  const testProvider = async (name: string, baseUrl?: string, apiKey?: string, model?: string) => {
    setTestResults((r) => ({ ...r, [name]: { testing: true } }));
    try {
      const res = await fetch("/api/route/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: baseUrl, apiKey, model }),
      });
      const data = await res.json();
      setTestResults((r) => ({ ...r, [name]: data }));
    } catch (e: any) {
      setTestResults((r) => ({ ...r, [name]: { ok: false, error: e?.message || String(e) } }));
    }
  };

  const addCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setCustom((c) => [...c, form]);
    setForm({ name: "", baseUrl: "", apiKey: "", model: "gpt-3.5-turbo" });
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">{t("nav.providers")}</h1>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">API Key Providers</h2>
        <p className="text-xs text-gray-400 mb-3">Test your API key connection before using.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {providers.apiKey.map((n: string) => (
            <div key={n} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="font-medium">{n}</div>
              <div className="text-xs mt-1">
                {testResults[n]?.testing ? t("common.loading") : testResults[n]?.ok ? `✅ ${t("common.working")}` : testResults[n]?.error ? `❌ ${t("common.failed")}` : t("common.notTested")}
              </div>
              <button
                onClick={() => testProvider(n)}
                className="mt-2 text-xs rounded px-2 py-1 bg-blue-500/20 text-blue-400"
              >
                {t("common.test")}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 p-4 rounded-2xl border border-white/10 bg-white/5">
        <h2 className="text-lg font-semibold mb-2">Custom Providers</h2>
        <p className="text-xs text-gray-400 mb-3">Add OpenAI or Anthropic compatible providers by pasting their base URL and API key.</p>
        <form onSubmit={addCustom} className="flex flex-wrap gap-2">
          <input
            className="rounded bg-white/10 border border-white/20 px-2 py-1 text-sm"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="rounded bg-white/10 border border-white/20 px-2 py-1 text-sm"
            placeholder="Base URL"
            value={form.baseUrl}
            onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
            required
          />
          <input
            className="rounded bg-white/10 border border-white/20 px-2 py-1 text-sm"
            placeholder="API Key"
            type="password"
            value={form.apiKey}
            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            required
          />
          <input
            className="rounded bg-white/10 border border-white/20 px-2 py-1 text-sm"
            placeholder="Model"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
          />
          <button type="submit" className="rounded bg-emerald-500/20 text-emerald-400 px-3 py-1 text-sm">
            + Add Provider
          </button>
        </form>
        {custom.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {custom.map((c) => (
              <div key={c.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-gray-400 mt-1">{c.baseUrl}</div>
                <button
                  onClick={() => testProvider(c.name, c.baseUrl, c.apiKey, c.model)}
                  className="mt-2 text-xs rounded px-2 py-1 bg-blue-500/20 text-blue-400"
                >
                  {t("common.test")}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
