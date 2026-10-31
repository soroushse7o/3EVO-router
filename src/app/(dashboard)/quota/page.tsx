"use client";
import { useEffect, useState } from "react";
export default function QuotaPage() {
  const [q, setQ] = useState<any>(null);
  useEffect(() => { 
    const fetchQ = async () => {
      const r = await fetch("/api/quota");
      setQ(await r.json());
    };
    fetchQ();
    const id = setInterval(fetchQ, 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Quota Tracker</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-gray-400">5h Rolling Window</div>
          <div className="text-2xl font-bold text-emerald-400">{q?.used ?? 0} / {q?.limit ?? 100000}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-gray-400">Tokens In / Out</div>
          <div className="text-2xl font-bold">{q?.tokensIn ?? 0} / {q?.tokensOut ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-gray-400">RTK Saved</div>
          <div className="text-2xl font-bold text-emerald-400">{q?.rtkSaved ?? 0}</div>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Usage</span>
          <span className="text-emerald-400">{q?.used ?? 0} / {q?.limit ?? 100000} ({(q?.used && q?.limit ? ((q.used/q.limit)*100).toFixed(1) : 0)}%)</span>
        </div>
        <div className="h-3 bg-white/10 rounded overflow-hidden">
          <div className="h-3 bg-emerald-400 rounded" style={{width: q?.used && q?.limit ? `${(q.used/q.limit)*100}%` : "0%"}}></div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Reset in: {q?.resetIn ? `${Math.round(q.resetIn/1000)}s` : "--"}</p>
      </div>
      <div className="mt-4 p-4 rounded-2xl border border-white/10 bg-white/5">
        <h2 className="text-sm font-semibold mb-2">Details</h2>
        <div className="text-xs text-gray-400 space-y-1">
          <div><span>Requests in window: </span><span className="text-white">{q?.requests ?? 0}</span></div>
          <div><span>Tokens in: </span><span className="text-white">{q?.tokensIn ?? 0}</span></div>
          <div><span>Tokens out: </span><span className="text-white">{q?.tokensOut ?? 0}</span></div>
          <div><span>RTK saved: </span><span className="text-emerald-400">{q?.rtkSaved ?? 0}</span></div>
        </div>
      </div>
    </div>
  );
}
