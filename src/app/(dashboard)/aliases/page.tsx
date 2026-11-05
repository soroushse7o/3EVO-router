"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { toast } from "@/components/toast-provider";

export default function AliasesPage() {
  const { t } = useI18n();
  const [aliases, setAliases] = useState<any[]>([]);
  const [form, setForm] = useState({ alias: "", provider: "", model: "" });
  const [loading, setLoading] = useState(false);

  const load = () => fetch("/api/aliases").then(r => r.json()).then(setAliases).catch(() => toast(t("aliases.failedLoad"), "error"));
  useEffect(() => { load(); }, []);

  const addAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/aliases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error(t("aliases.failedAdd"));
      setForm({ alias: "", provider: "", model: "" });
      load();
      toast(t("aliases.added"), "success");
    } catch (e: any) {
      toast(e?.message || t("aliases.failedAdd"), "error");
    } finally { setLoading(false); }
  };

  const remove = async (alias: string) => {
    await fetch(`/api/aliases/${encodeURIComponent(alias)}`, { method: "DELETE" });
    load();
    toast(t("aliases.removed"), "success");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">{t("aliases.title")}</h1>
        <p className="text-gray-400 text-sm">{t("aliases.subtitle")}</p>
      </div>

      <div className="rounded-2xl border border-gray-800/60 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-6 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-white mb-4">Add New Alias</h3>
        <form onSubmit={addAlias} className="flex flex-wrap gap-3">
          <input
            className="rounded-lg bg-black/30 border border-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
            placeholder="Alias (e.g. gpt-3.5)"
            value={form.alias}
            onChange={(e) => setForm({ ...form, alias: e.target.value })}
            required
          />
          <input
            className="rounded-lg bg-black/30 border border-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
            placeholder="Provider"
            value={form.provider}
            onChange={(e) => setForm({ ...form, provider: e.target.value })}
            required
          />
          <input
            className="rounded-lg bg-black/30 border border-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
            placeholder="Model"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 text-sm hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
          >
            {loading ? t("common.saving") : "+ Add Alias"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-gray-800/60 bg-gradient-to-br from-gray-900/80 to-gray-900/40 overflow-hidden backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left p-4 text-xs text-gray-500 uppercase tracking-wider font-medium">Alias</th>
              <th className="text-left p-4 text-xs text-gray-500 uppercase tracking-wider font-medium">Provider</th>
              <th className="text-left p-4 text-xs text-gray-500 uppercase tracking-wider font-medium">Model</th>
              <th className="text-right p-4 text-xs text-gray-500 uppercase tracking-wider font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {aliases.length === 0 ? (
              <tr>
                <td className="p-8 text-center text-gray-500 text-sm" colSpan={4}>
                  No aliases configured yet. Add one above.
                </td>
              </tr>
            ) : (
              aliases.map((a) => (
                <tr key={a.alias} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                  <td className="p-4"><code className="text-emerald-400 bg-black/30 px-2 py-1 rounded">{a.alias}</code></td>
                  <td className="p-4 text-gray-300">{a.provider}</td>
                  <td className="p-4 text-gray-300">{a.model}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => remove(a.alias)}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
