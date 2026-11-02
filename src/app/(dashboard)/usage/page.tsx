"use client";
import { useEffect, useState } from "react";
import { toast } from "@/components/toast-provider";

export default function UsagePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const total = (arr: any[], key: string) => (arr || []).reduce((sum, r) => sum + (r[key] || 0), 0);

  const exportCsv = () => {
    try {
      const rows = data || [];
      const header = "timestamp,provider,model,tokens_in,tokens_out,rtk_saved\n";
      const body = rows.map((r: any) => `${r.ts},${r.provider},${r.model},${r.tokens_in},${r.tokens_out},${r.rtk_saved}`).join("\n");
      const blob = new Blob([header + body], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "usage.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast("CSV exported", "success");
    } catch (e: any) {
      toast(e?.message || "Export failed", "error");
    }
  };

  useEffect(() => {
    fetch("/api/usage").then(r => r.json()).then(d => { setData(d.rows || []); setLoading(false); }).catch((e) => { setError(e?.message || "Failed"); setLoading(false); });
  }, []);

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-bold mb-4">Usage</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs text-gray-400">Requests</div><div className="text-2xl font-bold">{data?.length ?? 0}</div></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs text-gray-400">Tokens in</div><div className="text-2xl font-bold">{total(data, "tokens_in")}</div></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs text-gray-400">Tokens out</div><div className="text-2xl font-bold">{total(data, "tokens_out")}</div></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs text-gray-400">RTK saved</div><div className="text-2xl font-bold text-emerald-400">{total(data, "rtk_saved")}</div></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs text-gray-400">Est. Cost</div><div className="text-2xl font-bold text-amber-400">${data?.totalCost ? data.totalCost.toFixed(4) : "0.0000"}</div></div>
      </div>
      <button onClick={exportCsv} className="rounded bg-emerald-500/20 text-emerald-400 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40 hover:bg-emerald-500/30">Export CSV</button>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-gray-400"><tr><th className="p-2">Time</th><th className="p-2">Provider</th><th className="p-2">Model</th><th className="p-2">In</th><th className="p-2">Out</th><th className="p-2">RTK</th></tr></thead>
          <tbody>
            {error ? (
              <tr><td className="p-4 text-xs text-red-400" colSpan={6}>{error}</td></tr>
            ) : loading ? (
              <tr><td className="p-4 text-xs text-gray-400" colSpan={6}>Loading…</td></tr>
            ) : data?.length ? data.slice(-50).reverse().map((r: any, i: number) => (
              <tr key={i} className="border-t border-white/5">
                <td className="p-2 text-xs">{new Date(r.ts).toLocaleTimeString()}</td>
                <td className="p-2">{r.provider}</td>
                <td className="p-2">{r.model}</td>
                <td className="p-2">{r.tokens_in}</td>
                <td className="p-2">{r.tokens_out}</td>
                <td className="p-2 text-emerald-400">{r.rtk_saved}</td>
              </tr>
            )) : (
              <tr><td className="p-4 text-xs text-gray-500" colSpan={6}>No usage recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
