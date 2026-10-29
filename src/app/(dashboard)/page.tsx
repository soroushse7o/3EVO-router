import Link from "next/link";
export default function DashboardIndex(){
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Endpoint</h1>
      <p className="text-gray-400 text-sm mb-4">Base URL: http://localhost:20128/v1</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {["providers","combos","usage","settings"].map(p=>(
          <Link key={p} href={`/${p}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-emerald-400/40">{p}</Link>
        ))}
      </div>
    </div>
  );
}
