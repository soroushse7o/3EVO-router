"use client";
import { useEffect, useState } from "react";
import { toast } from "@/components/toast-provider";

type Settings = {
  requireLogin: boolean;
  requireApiKey: boolean;
  rtkEnabled: boolean;
  observabilityEnabled: boolean;
  monthlyBudgetUsd: number;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState<Settings>({ requireLogin: true, requireApiKey: false, rtkEnabled: false, observabilityEnabled: false, monthlyBudgetUsd: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => {
        setSettings(d);
        setForm({
          requireLogin: d.requireLogin ?? true,
          requireApiKey: d.requireApiKey ?? false,
          rtkEnabled: d.rtkEnabled ?? false,
          observabilityEnabled: d.observabilityEnabled ?? false,
          monthlyBudgetUsd: Number(d.monthlyBudgetUsd || 0),
        });
      })
      .catch(() => toast("Failed to load settings", "error"));
  }, []);

  if (!settings) return <div className="text-gray-400">Loading…</div>;

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      toast("Settings saved", "success");
    } catch (e: any) {
      toast(e?.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof Omit<Settings, "monthlyBudgetUsd">) => setForm((f) => ({ ...f, [key]: !f[key] }));

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <label className="flex items-center justify-between">
          <span>Require login for dashboard</span>
          <input type="checkbox" checked={form.requireLogin} onChange={() => toggle("requireLogin")} className="h-4 w-4" />
        </label>
        <label className="flex items-center justify-between">
          <span>Require API key for /v1/*</span>
          <input type="checkbox" checked={form.requireApiKey} onChange={() => toggle("requireApiKey")} className="h-4 w-4" />
        </label>
        <label className="flex items-center justify-between">
          <span>RTK cache</span>
          <input type="checkbox" checked={form.rtkEnabled} onChange={() => toggle("rtkEnabled")} className="h-4 w-4" />
        </label>
        <label className="flex items-center justify-between">
          <span>Observability</span>
          <input type="checkbox" checked={form.observabilityEnabled} onChange={() => toggle("observabilityEnabled")} className="h-4 w-4" />
        </label>
        <label className="flex items-center justify-between">
          <span>Monthly budget (USD, 0 = unlimited)</span>
          <input type="number" step="0.01" value={form.monthlyBudgetUsd} onChange={(e) => setForm({ ...form, monthlyBudgetUsd: Number(e.target.value) })} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-24 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40" />
        </label>
      </div>
      <button
        disabled={saving}
        onClick={saveSettings}
        className="rounded bg-emerald-500/20 text-emerald-400 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40 hover:bg-emerald-500/30 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
