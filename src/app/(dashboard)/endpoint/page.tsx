"use client";
import { useEffect, useState } from "react";

export default function EndpointPage() {
  const [status, setStatus] = useState<{ exhausted?: boolean; soonest?: string }>({});
  const [copied, setCopied] = useState(false);
  const base = "http://localhost:20128/v1";

  useEffect(() => {
    fetch("/api/route/test").then(r => r.json()).then(d => {
      if (d.error && d.error.includes("exhausted")) {
        setStatus({ exhausted: true, soonest: d.soonest });
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Endpoint</h1>
        <p className="text-gray-400 text-sm">Base URL and connection details</p>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Base URL</div>
        <div className="flex items-center gap-3">
          <code className="text-emerald-400 text-sm bg-black/30 px-3 py-1.5 rounded-lg border border-gray-800">{base}</code>
          <button
            onClick={() => { navigator.clipboard.writeText(base); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors"
          >
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {status.exhausted && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          All tiers exhausted. Soonest reset: {status.soonest ? `${Math.round(Number(status.soonest) / 1000)}s` : "unknown"}
        </div>
      )}

      <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="text-sm font-semibold text-white mb-3">Connection Status</h3>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Router API keys managed in dashboard. Remote (tunnel) status: offline.
        </div>
      </div>
    </div>
  );
}
