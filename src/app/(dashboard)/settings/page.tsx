"use client";
import { useEffect, useState } from "react";
import { toast } from "@/components/toast-provider";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [form, setForm] = useState({ port: "20128", secretPath: "", adminPassword: "" });
  const [keys, setKeys] = useState<{ id: number; name: string; created: number; revoked: number }[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = () => fetch("/api/api-keys").then(r => r.json()).then(setKeys).catch(() => toast("Failed to load API keys", "error"));
  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => {
      setSettings(d);
      setForm({ port: d.port || "20128", secretPath: d.secretPath || "", adminPassword: "" });
    }).catch(() => toast("Failed to load settings", "error"));
    load();
  }, []);

  if (!settings) return <div className="text-gray-400">Loading…</div>;

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Save failed");
      toast("Settings saved", "success");
    } catch (e: any) {
      toast(e?.message || "Save failed", "error");
    } finally { setSaving(false); }
  };

  const createKey = async () => {
    setCreating(true);
    try {
      const name = (document.getElementById("ak-name") as HTMLInputElement)?.value || "";
      const res = await fetch("/api/api-keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      if (res.ok) { const d = await res.json(); setNewKey(d.key); toast("API key created", "success"); load(); }
      else toast("Failed to create key", "error");
    } finally { setCreating(false); }
  };

  const revoke = async (id: number) => {
    await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    load();
    toast("API key revoked", "success");
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <label className="flex items-center justify-between"><span>Port</span><input value={form.port} onChange={e=>setForm({...form,port:e.target.value})} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-24 focus:outline-none focus:ring-2 focus:ring-emerald-400/40" /></label>
        <label className="flex items-center justify-between"><span>Secret path</span><input value={form.secretPath} onChange={e=>setForm({...form,secretPath:e.target.value})} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-40 focus:outline-none focus:ring-2 focus:ring-emerald-400/40" placeholder="16-32 chars" /></label>
        <label className="flex items-center justify-between"><span>Admin password</span><input type="password" value={form.adminPassword || ""} onChange={e=>setForm({...form,adminPassword:e.target.value})} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-64 focus:outline-none focus:ring-2 focus:ring-emerald-400/40" placeholder="min 8 chars" /></label>
      </div>
      <button disabled={saving} onClick={saveSettings} className="rounded bg-emerald-500/20 text-emerald-400 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40 hover:bg-emerald-500/30 disabled:opacity-50">
        {saving ? "Saving…" : "Save"}
      </button>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-lg font-semibold mb-2">API Keys</h2>
        <div className="flex gap-2 mb-3">
          <input className="bg-black/30 border border-white/10 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40" placeholder="Name (optional)" id="ak-name" />
          <button onClick={createKey} disabled={creating} className="rounded bg-emerald-500/20 text-emerald-400 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40 hover:bg-emerald-500/30 disabled:opacity-50">
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
        {newKey && (
          <div className="text-xs text-yellow-400 mb-2 rounded bg-yellow-500/10 border border-yellow-500/20 p-2 flex items-center justify-between">
            <span>New key: {newKey}</span>
            <button onClick={() => setNewKey(null)} className="underline ml-2 focus:outline-none focus:ring-2 focus:ring-yellow-400/40">dismiss</button>
          </div>
        )}
        <div className="space-y-2">
          {keys.map(k => (
            <div key={k.id} className="flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{k.name || "Unnamed"}</div>
                <div className="text-xs text-gray-400">Created {new Date(k.created).toLocaleString()} {k.revoked ? "• Revoked" : ""}</div>
              </div>
              {!k.revoked && <button onClick={() => revoke(k.id)} className="text-xs rounded px-2 py-1 bg-red-500/20 text-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/40 hover:bg-red-500/30">Revoke</button>}
            </div>
          ))}
          {!keys.length && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-xs text-gray-500">
              <div className="text-lg mb-1">🔑</div>
              <div>No API keys yet.</div>
              <div className="mt-1 text-gray-600">Create one to secure your API access.</div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
