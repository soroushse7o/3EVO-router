"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function LoginPage(){
  const [pw,setPw]=useState("");
  const router=useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-80 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-bold text-emerald-400 mb-4">Endpoint Proxy Login</h1>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password" className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 mb-3" />
        <button onClick={()=>router.push("/providers")} className="w-full rounded bg-emerald-500/20 text-emerald-400 py-2">Login</button>
      </div>
    </div>
  );
}
