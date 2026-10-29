export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r border-white/10 p-4">
        <div className="mb-6 text-emerald-400 font-bold">Endpoint Proxy <span className="text-xs text-gray-500">v1.0.0</span></div>
        <nav className="space-y-1 text-sm">
          {["Endpoint","Providers","Proxy Pools","Combos","Usage","Quota Tracker","MITM","CLI Tools"].map(n=>(
            <div key={n} className="px-2 py-1 rounded hover:bg-white/5">{n}</div>
          ))}
          <div className="mt-4 text-xs text-gray-500">DEBUG</div>
          <div className="px-2 py-1 rounded hover:bg-white/5">Console Log</div>
          <div className="mt-4 text-xs text-gray-500">SYSTEM</div>
          <div className="px-2 py-1 rounded hover:bg-white/5">Settings</div>
        </nav>
        <div className="mt-8 text-xs text-gray-500">Service is running in terminal. Shutdown stops service.</div>
        <button className="mt-2 w-full rounded bg-red-600/20 text-red-400 py-1">Shutdown</button>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
