"use client";
import { useState } from "react";
const templates = [
  { id: "premium-coding", name: "premium-coding", desc: "Tier1 Claude → Tier2 GLM → Tier3 Kiro" },
  { id: "budget-coding", name: "budget-coding", desc: "Tier1 GLM → Tier2 Qwen → Tier3 free" },
  { id: "free-combo", name: "free-combo", desc: "Tier1 Kiro → Tier2 iFlow → Tier3 Qwen" },
];
export default function CombosPage() {
  const [sel, setSel] = useState(templates[0].id);
  const t = templates.find(x => x.id === sel)!;
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Combos</h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        {templates.map(t => (
          <button key={t.id} onClick={() => setSel(t.id)} className={`px-3 py-1 rounded text-sm ${sel===t.id?"bg-emerald-500/20 text-emerald-400":"bg-white/5"}`}>{t.name}</button>
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="font-semibold">{t.name}</h2>
        <p className="text-gray-400 text-sm mt-1">{t.desc}</p>
        <p className="text-xs text-gray-500 mt-2">Appears as model name to clients.</p>
      </div>
    </div>
  );
}
