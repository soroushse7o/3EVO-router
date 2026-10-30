"use client";
import { useEffect, useState } from "react";
export default function QuotaPage() {
  const [q, setQ] = useState<any>(null);
  useEffect(() => { fetch("/api/quota").then(r => r.json()).then(setQ); }, []);
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Quota Tracker</h1>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex justify-between text-sm"><span>5h rolling window</span><span className="text-emerald-400">{q ? `${q.used} / ${q.limit}` : "0 / 100"}</span></div>
        <div className="h-2 bg-white/10 rounded mt-2"><div className="h-2 bg-emerald-400 rounded" style={{width: q ? `${(q.used/q.limit)*100}%` : "0%"}}></div></div>
        <p className="text-xs text-gray-500 mt-2">Reset countdown: {q?.resetIn ? `${Math.round(q.resetIn/1000)}s` : "--"}</p>
      </div>
    </div>
  );
}
