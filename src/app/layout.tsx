import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "3EVO Router", description: "Local-first AI gateway" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0e1a] text-white">{children}</body>
    </html>
  );
}
