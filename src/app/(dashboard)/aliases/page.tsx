"use client";
import { useEffect, useState } from "react";

export default function AliasesPage() {
  const [list, setList] = useState<{ alias: string; provider: string; model: string; fallback: string[] }[]>([]);
  const [form, setForm] = useState({ alias: "", provider: "", model: "", fallback: "" });
  const [err, setErr] = useState("");

  async function load() {
    const r = await fetch("/api/aliases");
    if (r.ok) setList(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const r = await fetch("/api/aliases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, fallback: form.fallback.split(",").map(s => s.trim()).filter(Boolean) }),
    });
    if (!r.ok) { setErr("save failed"); return; }
    setForm({ alias: "", provider: "", model: "", fallback: "" });
    load();
  }

  async function remove(alias: string) {
    await fetch(`/api/aliases/${encodeURIComponent(alias)}`, { method: "DELETE" });
    load();
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">مدل‌ها و Fallback</h1>
      <form onSubmit={submit} className="rounded-lg border border-white/10 p-4 mb-6 flex flex-wrap gap-2">
        <input className="rounded border px-2 py-1" placeholder="alias" value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} />
        <input className="rounded border px-2 py-1" placeholder="provider" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
        <input className="rounded border px-2 py-1" placeholder="model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        <input className="rounded border px-2 py-1" placeholder="fallback (comma)" value={form.fallback} onChange={(e) => setForm({ ...form, fallback: e.target.value })} />
        <button className="rounded bg-blue-600 px-3 py-1" type="submit">ایجاد</button>
        {err && <span className="text-red-500 text-sm">{err}</span>}
      </form>
      <div className="space-y-2">
        {list.map((item) => (
          <div key={item.alias} className="flex items-center justify-between rounded-lg border border-white/10 p-3">
            <div>
              <p className="font-mono">{item.alias} → {item.model}</p>
              <p className="text-sm opacity-70">provider: {item.provider} | fallback: {item.fallback.join(", ") || "—"}</p>
            </div>
            <button onClick={() => remove(item.alias)} className="text-red-500 text-sm">حذف</button>
          </div>
        ))}
      </div>
    </section>
  );
}
