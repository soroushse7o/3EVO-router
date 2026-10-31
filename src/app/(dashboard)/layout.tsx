import LangToggle from "@/components/lang-toggle";
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const links = [
    ["Endpoint", "/endpoint"],
    ["Providers", "/providers"],
    ["Proxy Pools", "/proxy-pools"],
    ["Combos", "/combos"],
    ["Usage", "/usage"],
    ["Quota Tracker", "/quota"],
    ["MITM", "/mitm"],
    ["CLI Tools", "/cli-tools"],
    ["Console Log", "/console-log"],
  ];
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r border-white/10 p-4 hidden md:block">
        <div className="mb-4 flex items-center justify-between text-emerald-400 font-bold">3EVO Router <span className="text-xs text-gray-500">v1.0.0</span><LangToggle/></div>
        <nav className="space-y-1 text-sm">
          {links.map(([n,h])=>(
            <a key={n} href={h} className="block px-2 py-1 rounded hover:bg-white/5">{n}</a>
          ))}
          <div className="mt-4 text-xs text-gray-500">SYSTEM</div>
          <a href="/settings" className="block px-2 py-1 rounded hover:bg-white/5">Settings</a>
        </nav>
        <div className="mt-8 text-xs text-gray-500">3EVO Router v1.0.0 Alpha</div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
