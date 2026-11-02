"use client";
import { I18nProvider } from "@/components/i18n-provider";
import ToastProvider from "@/components/toast-provider";
import Link from "next/link";
import LanguageToggle from "@/components/language-toggle";
import { usePathname } from "next/navigation";

const links = [
  ["Endpoint", "/endpoint"],
  ["Providers", "/providers"],
  ["Usage", "/usage"],
  ["Settings", "/settings"],
];

export default function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <I18nProvider>
      <ToastProvider>
        <div className="flex min-h-screen">
          <aside className="w-60 border-r border-white/10 p-4 hidden md:block">
            <div className="mb-4 flex items-center justify-between text-emerald-400 font-bold">3EVO Router <span className="text-xs text-gray-500">v1.0.0</span></div>
            <nav className="space-y-1 text-sm">
              {links.map(([n, h]) => (
                <Link key={h} href={h} className={`block px-2 py-1 rounded hover:bg-white/5 ${pathname === h ? "bg-white/10 text-emerald-300" : "text-gray-300"}`}>{n}</Link>
              ))}
              <div className="mt-4 text-xs text-gray-500">SYSTEM</div>
              <Link href="/settings" className={`block px-2 py-1 rounded hover:bg-white/5 ${pathname === "/settings" ? "bg-white/10 text-emerald-300" : "text-gray-300"}`}>Settings</Link>
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
      </ToastProvider>
    </I18nProvider>
  );
}
