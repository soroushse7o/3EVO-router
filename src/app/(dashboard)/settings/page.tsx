"use client";
import { useI18n } from "@/components/i18n-provider";
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
  const { t } = useI18n();
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
      .catch(() => toast(t("settings.failedLoad"), "error"));
  }, []);

  if (!settings) return <div className="text-gray-400">{t("common.loading")}...</div>;

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(t("settings.saveFailed"));
      toast(t("settings.saved"), "success");
    } catch (e: any) {
      toast(e?.message || t("settings.saveFailed"), "error");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof Omit<Settings, "monthlyBudgetUsd">) => setForm((f) => ({ ...f, [key]: !f[key] }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">{t("settings.title")}</h1>
        <p className="text-gray-400 text-sm">{t("settings.subtitle")}</p>
      </div>

      <div className="rounded-2xl border border-gray-800/60 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-6 space-y-5 backdrop-blur-sm">
        {[
          { key: "requireLogin", label: t("settings.requireLoginDashboard"), desc: t("settings.requireLogin") },
          { key: "requireApiKey", label: t("settings.enforceApiKey"), desc: t("settings.requireApiKey") },
          { key: "rtkEnabled", label: t("settings.rtk"), desc: t("settings.cacheResponses") },
          { key: "observabilityEnabled", label: t("settings.observability"), desc: t("settings.enableMetrics") },
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
            <div className="font-medium text-white text-sm">{t("settings.monthlyBudget")}</div>
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
        {saving ? t("common.saving") : t("settings.save")}
      </button>
    </div>
  );
}
