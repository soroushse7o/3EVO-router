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
      <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900/50 p-8 shadow-2xl backdrop-blur-sm">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
            3E
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">3EVO Router</h1>
          <p className="text-xs text-gray-500">Local AI Gateway</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs text-gray-400 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter dashboard password"
              className="w-full rounded-lg bg-black/30 border border-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-2.5 text-sm font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}
        </form>
        <p className="mt-6 text-center text-[11px] text-gray-600">
          Default password: <span className="text-gray-400">123456789</span>
        </p>
      </div>
    </div>
  );
}
