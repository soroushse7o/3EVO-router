"use client";
import { useI18n } from "@/components/i18n-provider";
import { useEffect, useState } from "react";

export default function RequestDetailsPage() {
  const { t } = useI18n();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/request-details")
      .then(r => r.json())
      .then(d => { setRequests(d.requests || []); setLoading(false); })
      .catch((e) => { setError(e?.message || "Failed"); setLoading(false); });
  }, []);

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) return { bg: "bg-emerald-500/10", text: "text-emerald-400", label: status.toString() };
    if (status >= 400 && status < 500) return { bg: "bg-amber-500/10", text: "text-amber-400", label: status.toString() };
    return { bg: "bg-red-500/10", text: "text-red-400", label: status.toString() };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">{t("requestDetails.title")}</h1>
        <p className="text-gray-400 text-sm">{t("requestDetails.subtitle")}</p>
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
                <th className="text-left p-3 text-xs text-gray-500 uppercase tracking-wider font-medium">Method</th>
                <th className="text-left p-3 text-xs text-gray-500 uppercase tracking-wider font-medium">Endpoint</th>
                <th className="text-left p-3 text-xs text-gray-500 uppercase tracking-wider font-medium">Status</th>
                <th className="text-left p-3 text-xs text-gray-500 uppercase tracking-wider font-medium">Duration</th>
                <th className="text-left p-3 text-xs text-gray-500 uppercase tracking-wider font-medium">Provider</th>
              </tr>
            </thead>
            <tbody>
              {error ? (
                <tr><td className="p-6 text-xs text-red-400" colSpan={6}>{error}</td></tr>
              ) : loading ? (
                <tr><td className="p-6 text-xs text-gray-500" colSpan={6}>{t("common.loading")}...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td className="p-6 text-xs text-gray-500" colSpan={6}>No requests recorded yet.</td></tr>
              ) : (
                requests.slice(0, 50).map((r: any, i: number) => {
                  const badge = getStatusBadge(r.status || 200);
                  return (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                      <td className="p-3 text-xs text-gray-400">{new Date(r.ts).toLocaleTimeString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono ${r.method === "POST" ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                          {r.method}
                        </span>
                      </td>
                      <td className="p-3"><code className="text-emerald-400 bg-black/30 px-2 py-0.5 rounded text-xs">{r.route}</code></td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-3 text-gray-400 text-xs">{r.latency_ms ? `${r.latency_ms}ms` : "-"}</td>
                      <td className="p-3 text-gray-300 text-xs">{r.provider || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
