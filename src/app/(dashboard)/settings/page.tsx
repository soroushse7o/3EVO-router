"use client";
import { useEffect, useState } from "react";
export default function SettingsPage() {
  const [port, setPort] = useState("20128");
  const [secretPath, setSecretPath] = useState("");
  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => { setPort(d.port); setSecretPath(d.secretPath); });
  }, []);
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <label className="flex items-center justify-between"><span>Port</span><input value={port} onChange={e=>setPort(e.target.value)} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-24" /></label>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <label className="flex items-center justify-between"><span>Secret path</span><input value={secretPath} onChange={e=>setSecretPath(e.target.value)} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-40" placeholder="16-32 chars" /></label>
      </div>
      <button className="rounded bg-emerald-500/20 text-emerald-400 px-3 py-1 text-sm" onClick={()=>fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({port,secretPath})})}>Save</button>
    </div>
  );
}
