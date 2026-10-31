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
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-gray-400">Proxy pools are planned but not wired into the outbound router yet. This page is not implemented.</p>
      </div>
    </div>
  );
}
