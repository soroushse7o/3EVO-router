"use client";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardIndex() {
  const { t } = useI18n();
  const [hasKey, setHasKey] = useState(false);
  const [hasProvider, setHasProvider] = useState(false);
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch("/api/api-keys").then(r => r.json()),
      fetch("/api/providers").then(r => r.json()),
    ])
      .then(([keys, providers]) => {
        setHasKey(Array.isArray(keys) && keys.length > 0);
        setHasProvider(Array.isArray(providers) && providers.length > 0);
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);

  const onboardingDone = hasKey && hasProvider;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">{t("dashboard.title")}</h1>
          <p className="text-gray-400 text-sm">{t("dashboard.subtitle")}</p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Operational
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: "1,284", icon: "📊", trend: "+12%" },
          { label: "Success Rate", value: "98.5%", icon: "✅", trend: "+0.3%" },
          { label: "Avg Latency", value: "142ms", icon: "⚡", trend: "-8ms" },
          { label: "Active Providers", value: "3", icon: "🔌", trend: "Stable" },
        ].map((stat, i) => (
          <div
            key={i}
            className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 p-5 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">{stat.icon}</div>
                <span className="text-xs text-emerald-400 font-medium">{stat.trend}</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Onboarding */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">🚀 Getting Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { done: hasKey, text: "Create an API key in Settings", action: !hasKey ? () => router.push("/settings") : undefined },
            { done: hasProvider, text: "Add at least one provider", action: !hasProvider ? () => router.push("/providers") : undefined },
            { done: onboardingDone, text: "Call /v1/chat/completions with your key", action: undefined },
          ].map((item, i) => (
            <div
              key={i}
              className={`
                flex items-start gap-3 p-4 rounded-xl border
                ${item.done
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                  : "bg-gray-800/30 border-gray-700 text-gray-300"
                }
              `}
            >
              <span className="text-xl">{item.done ? "✅" : "⬜"}</span>
              <div className="flex-1">
                <p className="text-sm">{item.text}</p>
                {item.action && (
                  <button
                    onClick={item.action}
                    className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                  >
                    Go to {i === 0 ? "Settings" : "Providers"} →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {checked && !onboardingDone && (
          <p className="mt-4 text-xs text-gray-500">Finish the checklist above to make your first request.</p>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Endpoint", "/endpoint", "🔗", "Base URL and copy snippet"],
          ["Providers", "/providers", "🔌", "Add/edit/test providers"],
          ["Usage", "/usage", "📈", "Upstream usage and CSV export"],
          ["Settings", "/settings", "⚙️", "API keys and preferences"],
        ].map(([label, href, icon, hint]) => (
          <Link
            key={href}
            href={href}
            className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 p-5 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="text-2xl mb-3">{icon}</div>
              <div className="font-semibold text-white mb-1">{label}</div>
              <div className="text-xs text-gray-500">{hint}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
