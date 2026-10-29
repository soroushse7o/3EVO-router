import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Endpoint Proxy", description: "3EVO Router" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0e1a] text-white">{children}</body>
    </html>
  );
}
