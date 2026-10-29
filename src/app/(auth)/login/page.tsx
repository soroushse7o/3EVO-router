"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function LoginPage(){
  const [pw,setPw]=useState("");
  const [err,setErr]=useState("");
  const router=useRouter();
  async function submit(){
    const r=await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:pw})});
    if(r.ok) router.push("/"); else setErr("Login failed");
  }
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-80 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-bold text-emerald-400 mb-4">Endpoint Proxy Login</h1>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password" className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 mb-3" />
        {err && <p className="text-red-400 text-xs mb-2">{err}</p>}
        <button onClick={submit} className="w-full rounded bg-emerald-500/20 text-emerald-400 py-2">Login</button>
      </div>
    </div>
  );
}
