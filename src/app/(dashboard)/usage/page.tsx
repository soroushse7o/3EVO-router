"use client";
import { useEffect, useState } from "react";
export default function UsagePage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/usage").then(r => r.json()).then(setData);
  }, []);
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Usage</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs text-gray-400">Requests</div><div className="text-2xl font-bold">{data?.requests ?? 0}</div></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs text-gray-400">Tokens in</div><div className="text-2xl font-bold">{data?.tokensIn ?? 0}</div></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs text-gray-400">Tokens out</div><div className="text-2xl font-bold">{data?.tokensOut ?? 0}</div></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs text-gray-400">RTK saved</div><div className="text-2xl font-bold text-emerald-400">{data?.rtkSaved ?? 0}</div></div>
      </div>
      <p className="text-gray-400 text-sm">Savings measured (before/after), not assumed. CSV export coming.</p>
    </div>
  );
}
