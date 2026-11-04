"use client";
import { useEffect, useState } from "react";
import { toast } from "@/components/toast-provider";

export default function UsagePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const total = (arr: any[], key: string) => (arr || []).reduce((sum: number, r: any) => sum + (r[key] || 0), 0);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Usage</h1>
          <p className="text-gray-400 text-sm">Upstream usage and cost tracking</p>
        </div>
        <button
          onClick={exportCsv}
          className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/20 transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Requests", value: data?.length ?? 0 },
          { label: "Tokens In", value: total(data, "tokens_in") },
          { label: "Tokens Out", value: total(data, "tokens_out") },
          { label: "RTK Saved", value: `$${total(data, "rtk_saved").toFixed(2)}` },
          { label: "Est. Cost", value: `$${data?.totalCost ? data.totalCost.toFixed(4) : "0.0000"}` },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-gray-800 bg-gray-900/50 p-5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">{stat.label}</div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900/50 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-white">Recent Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-3 text-xs text-gray-500 uppercase tracking-wider font-medium">Time</th>
                <th className="text-left p-3 text-xs text-gray-500 uppercase tracking-wider font-medium">Provider</th>
                <th className="text-left p-3 text-xs text-gray-500 uppercase tracking-wider font-medium">Model</th>
                <th className="text-left p-3 text-xs text-gray-500 uppercase tracking-wider font-medium">In</th>
                <th className="text-left p-3 text-xs text-gray-500 uppercase tracking-wider font-medium">Out</th>
                <th className="text-left p-3 text-xs text-gray-500 uppercase tracking-wider font-medium">RTK</th>
              </tr>
            </thead>
            <tbody>
              {error ? (
                <tr><td className="p-6 text-xs text-red-400" colSpan={6}>{error}</td></tr>
              ) : loading ? (
                <tr><td className="p-6 text-xs text-gray-500" colSpan={6}>Loading...</td></tr>
              ) : data?.length ? data.slice(-50).reverse().map((r: any, i: number) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                  <td className="p-3 text-xs text-gray-400">{new Date(r.ts).toLocaleTimeString()}</td>
                  <td className="p-3 text-gray-300">{r.provider}</td>
                  <td className="p-3 text-gray-300">{r.model}</td>
                  <td className="p-3 text-gray-400">{r.tokens_in}</td>
                  <td className="p-3 text-gray-400">{r.tokens_out}</td>
                  <td className="p-3 text-emerald-400">${r.rtk_saved}</td>
                </tr>
              )) : (
                <tr><td className="p-6 text-xs text-gray-500" colSpan={6}>No usage recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
