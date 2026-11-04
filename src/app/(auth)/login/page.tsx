"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-emerald-400">3EVO Router</h1>
          <p className="mt-1 text-xs text-gray-400">Local AI Gateway</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter dashboard password"
              className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-emerald-400/60 focus:outline-none focus:ring-1 focus:ring-emerald-400/40"
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-emerald-500/20 text-emerald-400 py-2 text-sm font-medium hover:bg-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </form>
        <p className="mt-4 text-center text-[11px] text-gray-500">
          Default password: <span className="text-gray-300">123456789</span>
        </p>
      </div>
    </div>
  );
}
