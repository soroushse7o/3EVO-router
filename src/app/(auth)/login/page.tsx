import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth";

export default async function LoginPage() {
  const cookieStore = await import("next/headers").then(m => m.cookies());
  const session = cookieStore.get("session")?.value;
  if (validateSession(session)) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-80 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-bold text-emerald-400 mb-4">Endpoint Proxy Login</h1>
        <form action="/api/auth" method="POST">
          <input type="password" name="password" placeholder="Password" className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 mb-3" required />
          <button type="submit" className="w-full rounded bg-emerald-500/20 text-emerald-400 py-2">Login</button>
        </form>
      </div>
    </div>
  );
}
