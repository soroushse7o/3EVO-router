import { redirect } from "next/navigation";
import { I18nProvider } from "@/components/i18n-provider";
import Link from "next/link";
import LanguageToggle from "@/components/language-toggle";
import { validateSession } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await import("next/headers").then(m => m.cookies());
  const session = cookieStore.get("session")?.value;
  if (!validateSession(session)) redirect("/login");

  const links = [
    ["Endpoint", "/endpoint"],
    ["Providers", "/providers"],
    ["Usage", "/usage"],
    ["Settings", "/settings"],
  ];
  return (
    <I18nProvider>
      <div className="flex min-h-screen">
        <aside className="w-60 border-r border-white/10 p-4 hidden md:block">
          <div className="mb-4 flex items-center justify-between text-emerald-400 font-bold">3EVO Router <span className="text-xs text-gray-500">v1.0.0</span></div>
          <nav className="space-y-1 text-sm">
            {links.map(([n,h])=>(
              <Link key={n} href={h} className="block px-2 py-1 rounded hover:bg-white/5">{n}</Link>
            ))}
            <div className="mt-4 text-xs text-gray-500">SYSTEM</div>
            <Link href="/settings" className="block px-2 py-1 rounded hover:bg-white/5">Settings</Link>
          </nav>
          <div className="mt-8 text-xs text-gray-500">3EVO Router v1.0.0 Alpha</div>
        </aside>
        <main className="flex-1 p-6">
          <div className="mb-4 flex justify-end">
            <LanguageToggle />
          </div>
          {children}
        </main>
      </div>
    </I18nProvider>
  );
}
