"use client";
import { useEffect, useState } from "react";
export default function ProxyPoolsPage() {
  const [pools, setPools] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", url: "", strategy: "round-robin" });
  const [loading, setLoading] = useState(false);
  const load = async () => {
    const r = await fetch("/api/proxy-pools");
    if (r.ok) setPools(await r.json());
  };
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!form.name || !form.url) return;
    setLoading(true);
    await fetch("/api/proxy-pools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ name: "", url: "", strategy: "round-robin" });
    setLoading(false);
    load();
  };
  const remove = async (id: string) => {
    await fetch(`/api/proxy-pools?id=${id}`, { method: "DELETE" });
    load();
  };
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Proxy Pools</h1>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input className="rounded bg-white/10 px-3 py-2 text-sm" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="rounded bg-white/10 px-3 py-2 text-sm" placeholder="http://proxy:8080" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
          <select className="rounded bg-white/10 px-3 py-2 text-sm" value={form.strategy} onChange={e => setForm({ ...form, strategy: e.target.value })}>
            <option value="round-robin">Round Robin</option>
            <option value="priority">Priority</option>
          </select>
        </div>
        <button className="rounded bg-emerald-500/20 text-emerald-400 px-3 py-1 text-sm" onClick={add} disabled={loading}>Add proxy</button>
      </div>
      <div className="space-y-2">
        {pools.map(p => (
          <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-gray-400">{p.url}</div>
              <div className="text-xs text-gray-500">Strategy: {p.strategy} • Active: {p.active ? "Yes" : "No"}</div>
            </div>
            <button className="text-xs rounded bg-red-600/20 text-red-400 px-2 py-1" onClick={() => remove(p.id)}>Remove</button>
          </div>
        ))}
        {pools.length === 0 && <div className="text-sm text-gray-500">No proxy pools yet.</div>}
      </div>
    </div>
  );
}
