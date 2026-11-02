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
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Endpoint</h1>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs text-gray-400 mb-1">Base URL</div>
        <div className="flex items-center gap-2">
          <code className="text-emerald-400 text-sm">{base}</code>
          <button onClick={() => { navigator.clipboard.writeText(base); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-xs bg-white/10 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-emerald-400/40 hover:bg-white/20">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      {status.exhausted && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          All tiers exhausted. Soonest reset: {status.soonest ? `${Math.round(Number(status.soonest) / 1000)}s` : "unknown"}
        </div>
      )}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
        Router API keys managed in dashboard. Remote (tunnel) status: offline.
      </div>
    </div>
  );
}
