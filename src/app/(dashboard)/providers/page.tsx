"use client";
import { useEffect, useState } from "react";
import providers from "@/data/providers.json";
import { useI18n } from "@/components/i18n-provider";
import { toast } from "@/components/toast-provider";

export default function ProvidersPage() {
  const { t } = useI18n();
  const [custom, setCustom] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [form, setForm] = useState({ name: "", baseUrl: "", apiKey: "", model: "gpt-3.5-turbo", priceIn: 0, priceOut: 0 });
  const [loading, setLoading] = useState(false);

  const load = () => fetch("/api/providers").then(r => r.json()).then(setCustom).catch(() => toast("Failed to load providers", "error"));
  useEffect(() => { load(); }, []);

  const testProvider = async (name: string, baseUrl?: string, apiKey?: string, model?: string) => {
    setTestResults((r) => ({ ...r, [name]: { testing: true } }));
    try {
      const res = await fetch("/api/route/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: baseUrl, apiKey, model }) });
      const data = await res.json();
      setTestResults((r) => ({ ...r, [name]: data }));
      toast(data?.ok ? `Test passed for ${name}` : `Test failed for ${name}`, data?.ok ? "success" : "error");
    } catch (e: any) {
      const msg = e?.message || String(e);
      setTestResults((r) => ({ ...r, [name]: { ok: false, error: msg } }));
      toast(`Test error for ${name}: ${msg}`, "error");
    }
  };

  const addCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/providers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Failed to add provider");
      setForm({ name: "", baseUrl: "", apiKey: "", model: "gpt-3.5-turbo", priceIn: 0, priceOut: 0 });
      load();
      toast("Provider added", "success");
    } catch (e: any) {
      toast(e?.message || "Add failed", "error");
    } finally { setLoading(false); }
  };

  const remove = async (id: number) => {
    await fetch(`/api/providers/${id}`, { method: "DELETE" });
    load();
    toast("Provider removed", "success");
  };

  return (
    <div className="max-w-4xl">
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
              <button onClick={() => testProvider(n)} className="mt-2 text-xs rounded px-2 py-1 bg-blue-500/20 text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40 hover:bg-blue-500/30">
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
          <input className="rounded bg-white/10 border border-white/20 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="rounded bg-white/10 border border-white/20 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40" placeholder="Base URL" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} required />
          <input className="rounded bg-white/10 border border-white/20 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40" placeholder="API Key" type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} required />
          <input className="rounded bg-white/10 border border-white/20 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40" placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          <input className="rounded bg-white/10 border border-white/20 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40" placeholder="Price in/1k" type="number" step="0.01" value={form.priceIn} onChange={(e) => setForm({ ...form, priceIn: Number(e.target.value) })} />
          <input className="rounded bg-white/10 border border-white/20 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40" placeholder="Price out/1k" type="number" step="0.01" value={form.priceOut} onChange={(e) => setForm({ ...form, priceOut: Number(e.target.value) })} />
          <button type="submit" disabled={loading} className="rounded bg-emerald-500/20 text-emerald-400 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40 hover:bg-emerald-500/30 disabled:opacity-50">
            {loading ? "Saving…" : "+ Add Provider"}
          </button>
        </form>
        {custom.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {custom.map((c) => (
              <div key={c.id || c.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-gray-400 mt-1">{c.baseUrl}</div>
                <div className="text-xs text-gray-500 mt-1">Model: {c.model || "gpt-3.5-turbo"}</div>
                <div className="text-xs text-gray-500">Price: ${(c.price_in || c.priceIn || 0).toFixed(4)} in / ${(c.price_out || c.priceOut || 0).toFixed(4)} out per 1k</div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => testProvider(c.name, c.baseUrl, c.apiKey, c.model)} className="text-xs rounded px-2 py-1 bg-blue-500/20 text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40 hover:bg-blue-500/30">
                    {t("common.test")}
                  </button>
                  <button onClick={() => remove(c.id)} className="text-xs rounded px-2 py-1 bg-red-500/20 text-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/40 hover:bg-red-500/30">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-xs text-gray-500">
            <div className="text-lg mb-1">📭</div>
            <div>No custom providers yet.</div>
            <div className="mt-1 text-gray-600">Add your first provider above to get started.</div>
          </div>
        )}
      </section>
    </div>
  );
}
