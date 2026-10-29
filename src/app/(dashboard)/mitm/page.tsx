"use client";
import { useState } from "react";
export default function MitmPage() {
  const [consent, setConsent] = useState(false);
  const [enabled, setEnabled] = useState(false);
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">MITM (opt-in, local only)</h1>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
        Requires explicit consent. Root cert installed by user (never silently). Per-host allowlist. Off by default.
      </div>
      <label className="flex items-center gap-2"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} /> I understand and consent</label>
      <button disabled={!consent} onClick={()=>setEnabled(!enabled)} className="rounded bg-emerald-500/20 text-emerald-400 px-3 py-1 text-sm disabled:opacity-40">
        {enabled ? "Disable MITM" : "Enable MITM"}
      </button>
      {enabled && <p className="text-emerald-400 text-sm">MITM enabled (stub).</p>}
    </div>
  );
}
