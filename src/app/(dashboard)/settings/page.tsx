"use client";
import { useEffect, useState } from "react";
export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [form, setForm] = useState({ port: "20128", secretPath: "", adminPassword: "" });
  const [keys, setKeys] = useState<{ id: number; name: string; created: number; revoked: number }[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);

  const load = () => fetch("/api/api-keys").then(r => r.json()).then(setKeys);
  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => {
      setSettings(d);
      setForm({ port: d.port || "20128", secretPath: d.secretPath || "", adminPassword: "" });
    });
    load();
  }, []);

  if (!settings) return <div className="text-gray-400">Loading…</div>;
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <label className="flex items-center justify-between"><span>Port</span><input value={form.port} onChange={e=>setForm({...form,port:e.target.value})} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-24" /></label>
        <label className="flex items-center justify-between"><span>Secret path</span><input value={form.secretPath} onChange={e=>setForm({...form,secretPath:e.target.value})} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-40" placeholder="16-32 chars" /></label>
        <label className="flex items-center justify-between"><span>Admin password</span><input type="password" value={form.adminPassword || ""} onChange={e=>setForm({...form,adminPassword:e.target.value})} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-64" placeholder="min 8 chars" /></label>
      </div>
      <button className="rounded bg-emerald-500/20 text-emerald-400 px-3 py-1 text-sm" onClick={()=>fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)}).then(()=>alert("saved"))}>Save</button>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-lg font-semibold mb-2">API Keys</h2>
        <div className="flex gap-2 mb-3">
          <input className="bg-black/30 border border-white/10 rounded px-2 py-1 text-sm" placeholder="Name (optional)" id="ak-name" />
          <button className="rounded bg-emerald-500/20 text-emerald-400 px-3 py-1 text-sm" onClick={async () => {
            const name = (document.getElementById("ak-name") as HTMLInputElement)?.value || "";
            const res = await fetch("/api/api-keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
            if (res.ok) { const d = await res.json(); setNewKey(d.key); load(); }
          }}>Create</button>
        </div>
        {newKey && <div className="text-xs text-yellow-400 mb-2">New key: {newKey} <button onClick={() => setNewKey(null)} className="ml-2 underline">dismiss</button></div>}
        <div className="space-y-2">
          {keys.map(k => (
            <div key={k.id} className="flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{k.name || "Unnamed"}</div>
                <div className="text-xs text-gray-400">Created {new Date(k.created).toLocaleString()} {k.revoked ? "• Revoked" : ""}</div>
              </div>
              {!k.revoked && <button className="text-xs rounded px-2 py-1 bg-red-500/20 text-red-400" onClick={async () => {
                await fetch(`/api/api-keys/${k.id}`, { method: "DELETE" });
                load();
              }}>Revoke</button>}
            </div>
          ))}
          {!keys.length && <div className="text-xs text-gray-500">No API keys yet.</div>}
        </div>
      </section>
    </div>
  );
}
