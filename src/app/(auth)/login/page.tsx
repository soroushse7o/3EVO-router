"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) router.push("/");
    else setError((await res.json()).error || "Login failed");
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-80 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-bold text-emerald-400 mb-4">Endpoint Proxy Login</h1>
        <form onSubmit={onSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 mb-3"
            required
          />
          <button type="submit" className="w-full rounded bg-emerald-500/20 text-emerald-400 py-2">Login</button>
          {error && <p className="mt-2 text-red-400 text-xs">{error}</p>}
        </form>
      </div>
    </div>
  );
}
