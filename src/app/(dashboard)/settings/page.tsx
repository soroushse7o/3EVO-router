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
  const [form, setForm] = useState<Settings>({ requireLogin: true, requireApiKey: true, rtkEnabled: false, observabilityEnabled: false, monthlyBudgetUsd: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => {
        setSettings(d);
        setForm({
          requireLogin: d.requireLogin ?? true,
          requireApiKey: d.requireApiKey ?? true,
          rtkEnabled: d.rtkEnabled ?? false,
          observabilityEnabled: d.observabilityEnabled ?? false,
          monthlyBudgetUsd: Number(d.monthlyBudgetUsd || 0),
        });
      })
      .catch(() => toast("Failed to load settings", "error"));
  }, []);

  if (!settings) return <div className="text-gray-400">Loading...</div>;

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
        <p className="text-gray-400 text-sm">Configure gateway behavior and preferences</p>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 space-y-5">
        {[
          { key: "requireLogin", label: "Require login for dashboard", desc: "Protect dashboard with authentication" },
          { key: "requireApiKey", label: "Require API key for /v1/*", desc: "Enforce API key authentication" },
          { key: "rtkEnabled", label: "RTK cache", desc: "Cache responses to reduce token costs" },
          { key: "observabilityEnabled", label: "Observability", desc: "Enable metrics and logging" },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div>
              <div className="font-medium text-white text-sm">{item.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
            </div>
            <button
              onClick={() => toggle(item.key as any)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form[item.key as keyof Settings] ? "bg-emerald-500/30" : "bg-gray-800"}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form[item.key as keyof Settings] ? "translate-x-5" : ""}`} />
            </button>
          </div>
        ))}

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-white text-sm">Monthly budget (USD)</div>
            <div className="text-xs text-gray-500 mt-0.5">0 = unlimited</div>
          </div>
          <input
            type="number"
            step="0.01"
            value={form.monthlyBudgetUsd}
            onChange={(e) => setForm({ ...form, monthlyBudgetUsd: Number(e.target.value) })}
            className="bg-black/30 border border-gray-800 rounded-lg px-3 py-1.5 w-24 text-sm text-white text-right focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
          />
        </div>
      </div>

      <button
        disabled={saving}
        onClick={saveSettings}
        className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 text-sm hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
