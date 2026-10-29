"use client";
export default function ProxyPoolsPage() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Proxy Pools</h1>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
        Outbound HTTP/SOCKS proxies, assign to providers/accounts, health check, rotation. (stub)
      </div>
      <button className="mt-3 rounded bg-emerald-500/20 text-emerald-400 px-3 py-1 text-sm">Add proxy</button>
    </div>
  );
}
