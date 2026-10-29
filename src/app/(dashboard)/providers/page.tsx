"use client";
import { useState } from "react";
import providers from "@/data/providers.json";
export default function ProvidersPage(){
  const [conns,setConns]=useState<Record<string,boolean>>({});
  const toggle=(n:string)=>setConns(c=>({...c,[n]:!c[n]}));
  const sections = [
    {title:"OAuth Providers", items: providers.oauth},
    {title:"Free Providers", items: providers.free},
    {title:"API Key Providers", items: providers.apiKey},
  ];
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Providers</h1>
      {sections.map(s=>(
        <section key={s.title} className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">{s.title} <span className="text-xs text-gray-500">({s.items.filter(n=>conns[n]).length})</span></h2>
            <button className="text-xs text-emerald-400" onClick={()=>s.items.forEach(n=>setConns(c=>({...c,[n]:true})))}>Test All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {s.items.map(n=>(
              <div key={n} className={`rounded-2xl border p-4 ${conns[n]?"border-emerald-400/60 shadow-[0_0_12px_#10E58A33] bg-emerald-500/5":"border-white/10 bg-white/5"}`}>
                <div className="font-medium">{n}</div>
                <div className="text-xs mt-1">{conns[n]?"1 Connected":"No connections"}</div>
                <button onClick={()=>toggle(n)} className="mt-2 text-xs rounded bg-white/10 px-2 py-1">{conns[n]?"Disconnect":"Connect (key)"}</button>
              </div>
            ))}
          </div>
        </section>
      ))}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">API Key Compatible Providers</h2>
        <div className="flex gap-2">
          <button className="rounded bg-emerald-500/20 text-emerald-400 px-3 py-1 text-sm">Add Anthropic Compatible</button>
          <button className="rounded bg-emerald-500/20 text-emerald-400 px-3 py-1 text-sm">Add OpenAI Compatible</button>
        </div>
      </section>
    </div>
  );
}
