"use client";
export default function QuotaPage() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Quota Tracker</h1>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex justify-between text-sm"><span>5h rolling window</span><span className="text-emerald-400">0 / 100</span></div>
        <div className="h-2 bg-white/10 rounded mt-2"><div className="h-2 bg-emerald-400 rounded" style={{width:"0%"}}></div></div>
        <p className="text-xs text-gray-500 mt-2">Reset countdown: --</p>
      </div>
    </div>
  );
}
