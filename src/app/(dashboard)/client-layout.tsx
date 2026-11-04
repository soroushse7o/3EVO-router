"use client";
import { I18nProvider } from "@/components/i18n-provider";
import ToastProvider from "@/components/toast-provider";
import Link from "next/link";
import LanguageToggle from "@/components/language-toggle";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  ["Dashboard", "/", "📊"],
  ["Endpoint", "/endpoint", "🔗"],
  ["Providers", "/providers", "🔌"],
  ["Aliases", "/aliases", "🔀"],
  ["Request Details", "/request-details", "📋"],
  ["Usage", "/usage", "📈"],
  ["Settings", "/settings", "⚙️"],
];

export default function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <I18nProvider>
      <ToastProvider>
        <div className="flex min-h-screen bg-gray-950 text-gray-100">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 border border-gray-800 rounded-lg hover:border-emerald-500/50 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Sidebar */}
          <aside
            className={`
              fixed md:static inset-y-0 left-0 z-40
              w-64 bg-gray-900 border-r border-gray-800
              transform transition-transform duration-300 ease-in-out
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
              flex flex-col
            `}
          >
            {/* Logo */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                    3E
                  </div>
                  <div>
                    <div className="font-bold text-lg text-white">3EVO Router</div>
                    <div className="text-xs text-gray-500">v1.0.0</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {links.map(([n, h, icon]) => {
                const isActive = pathname === h;
                return (
                  <Link
                    key={h}
                    href={h}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-all duration-200 group
                      ${isActive
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border border-transparent"
                      }
                    `}
                  >
                    <span className="text-lg">{icon}</span>
                    <span className="font-medium text-sm">{n}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs text-gray-500">Stable v1.0.0</span>
                <LanguageToggle />
              </div>
            </div>
          </aside>

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="md:hidden fixed inset-0 bg-black/50 z-30"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="p-4 md:p-8 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </ToastProvider>
    </I18nProvider>
  );
}
