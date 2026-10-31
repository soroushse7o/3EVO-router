"use client";
import { useEffect, useState } from "react";

function CertStatus() {
  const [hasCert, setHasCert] = useState(false);
  const [paths, setPaths] = useState<{ certPath?: string; keyPath?: string }>({});

  useEffect(() => {
    fetch("/api/mitm/cert").then(r => r.json()).then(d => {
      setHasCert(d.hasCert);
      setPaths(d.paths || {});
    });
  }, []);

  const generate = async () => {
    const r = await fetch("/api/mitm/cert", { method: "POST" });
    const d = await r.json();
    if (d.ok) {
      setHasCert(true);
      setPaths(d.paths || {});
    }
  };

  return (
    <div>
      <div className="text-xs text-gray-400 mb-2">
        {hasCert ? `Cert installed: ${paths.certPath}` : "No root certificate installed."}
      </div>
      <button className="text-xs rounded bg-emerald-500/20 text-emerald-400 px-2 py-1" onClick={generate}>
        {hasCert ? "Regenerate Root Cert" : "Generate Root Cert"}
      </button>
      {hasCert && (
        <div className="mt-2 text-xs text-gray-500">
          Install the certificate in your OS/browser trust store to enable MITM.
        </div>
      )}
    </div>
  );
}

export default function MitmPage() {
  const [consent, setConsent] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [allowlist, setAllowlist] = useState<string[]>([]);
  const [host, setHost] = useState("");

  useEffect(() => {
    fetch("/api/mitm/status").then(r => r.json()).then(d => {
      setEnabled(d.enabled);
      setAllowlist(d.allowlist || []);
    });
  }, []);

  const toggle = async () => {
    const r = await fetch("/api/mitm/toggle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !enabled, consent: true }) });
    const d = await r.json();
    setEnabled(d.enabled);
  };

  const addHost = async () => {
    if (!host) return;
    await fetch("/api/mitm/allowlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ host }) });
    setHost("");
    setAllowlist([...allowlist, host]);
  };

  const removeHost = async (h: string) => {
    await fetch(`/api/mitm/allowlist?host=${encodeURIComponent(h)}`, { method: "DELETE" });
    setAllowlist(allowlist.filter(x => x !== h));
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">MITM (opt-in, local only)</h1>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
        Intercepts HTTPS for inspection. Requires explicit consent. Root cert installed by user. Per-host allowlist. Off by default.
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
        <span className="text-sm">I understand and consent to MITM interception</span>
      </label>
      <button disabled={!consent} onClick={toggle} className="rounded bg-emerald-500/20 text-emerald-400 px-3 py-1 text-sm disabled:opacity-40">
        {enabled ? "Disable MITM" : "Enable MITM"}
      </button>
      {enabled && <p className="text-emerald-400 text-sm">MITM enabled.</p>}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-semibold mb-2">Root Certificate</h2>
        <CertStatus />
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-semibold mb-2">Per-host allowlist</h2>
        <div className="flex gap-2 mb-2">
          <input className="rounded bg-white/10 px-2 py-1 text-sm flex-1" placeholder="example.com" value={host} onChange={e => setHost(e.target.value)} />
          <button className="rounded bg-emerald-500/20 text-emerald-400 px-2 py-1 text-sm" onClick={addHost}>Add</button>
        </div>
        <div className="space-y-1">
          {allowlist.map(h => (
            <div key={h} className="flex items-center justify-between text-sm">
              <span>{h}</span>
              <button className="text-xs text-red-400" onClick={() => removeHost(h)}>Remove</button>
            </div>
          ))}
          {allowlist.length === 0 && <div className="text-xs text-gray-500">No hosts allowed.</div>}
        </div>
      </div>
    </div>
  );
}
