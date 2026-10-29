"use client";
export default function EndpointPage() {
  const base = "http://localhost:20128/v1";
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Endpoint</h1>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs text-gray-400 mb-1">Base URL</div>
        <code className="text-emerald-400">{base}</code>
        <button className="ml-2 text-xs bg-white/10 px-2 py-1 rounded" onClick={()=>navigator.clipboard.writeText(base)}>Copy</button>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
        Router API keys managed in dashboard. Remote (tunnel) status: offline.
      </div>
    </div>
  );
}
