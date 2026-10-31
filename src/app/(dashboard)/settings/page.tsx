"use client";
import { useEffect, useState } from "react";
export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [form, setForm] = useState({ port: "20128", secretPath: "", lang: "en", rtk: true, adminPassword: "" });
  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => {
      setSettings(d);
      setForm({ port: d.port || "20128", secretPath: d.secretPath || "", lang: d.lang || "en", rtk: d.rtk ?? true, adminPassword: "" });
    });
  }, []);
  if (!settings) return <div className="text-gray-400">Loading…</div>;
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <label className="flex items-center justify-between"><span>Port</span><input value={form.port} onChange={e=>setForm({...form,port:e.target.value})} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-24" /></label>
        <label className="flex items-center justify-between"><span>Secret path</span><input value={form.secretPath} onChange={e=>setForm({...form,secretPath:e.target.value})} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-40" placeholder="16-32 chars" /></label>
        <label className="flex items-center justify-between"><span>Language</span>
          <select value={form.lang} onChange={e=>setForm({...form,lang:e.target.value})} className="bg-black/30 border border-white/10 rounded px-2 py-1">
            <option value="en">English</option><option value="fa">فارسی</option>
          </select>
        </label>
        <label className="flex items-center justify-between"><span>RTK compression</span><input type="checkbox" checked={form.rtk} onChange={e=>setForm({...form,rtk:e.target.checked})} /></label>
        <label className="flex items-center justify-between"><span>Admin password</span><input type="password" value={form.adminPassword || ""} onChange={e=>setForm({...form,adminPassword:e.target.value})} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-64" placeholder="min 8 chars" /></label>
      </div>
      <button className="rounded bg-emerald-500/20 text-emerald-400 px-3 py-1 text-sm" onClick={()=>fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)}).then(()=>alert("saved"))}>Save</button>
    </div>
  );
}
