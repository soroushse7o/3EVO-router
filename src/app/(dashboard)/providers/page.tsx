"use client";
import { useState } from "react";
import providers from "@/data/providers.json";
export default function ProvidersPage(){
  const [conns,setConns]=useState<Record<string,any>>({});
  const toggleOAuth=async(n:string)=>{
    const r=await fetch("/api/oauth/start",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider:n,flow:"device"})});
    const d=await r.json();
    setConns(c=>({...c,[n]:{status:false,device:d.device_code,expires:d.expires_in}}));
    const id=setInterval(async()=>{
      const r2=await fetch("/api/oauth/callback",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider:n,device_code:d.device_code})});
      const d2=await r2.json();
      if(d2.status==="complete"){
        clearInterval(id);
        setConns(c=>({...c,[n]:{status:true,device:d.device_code,expires:d.expires_in}}));
      }
    },d.interval*1000);
  };
  const sections = [
    {title:"OAuth Providers", items: providers.oauth, color: "text-blue-400", action: true},
    {title:"Free Providers", items: providers.free, color: "text-emerald-400"},
    {title:"API Key Providers", items: providers.apiKey, color: "text-amber-400"},
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
                <button onClick={()=>toggleOAuth(n)} className={`mt-2 text-xs rounded px-2 py-1 ${conns[n]?"bg-red-600/20 text-red-400":"bg-emerald-500/20 text-emerald-400"}`}>
                  {conns[n]?"Disconnect":"Connect"}
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}
      <section className="mb-6 p-4 rounded-2xl border border-white/10 bg-white/5">
        <h2 className="text-lg font-semibold mb-2">Custom Providers</h2>
        <p className="text-xs text-gray-400 mb-3">Add OpenAI or Anthropic compatible providers by pasting their base URL and API key.</p>
        <div className="flex flex-wrap gap-2">
          <button className="rounded bg-emerald-500/20 text-emerald-400 px-3 py-1 text-sm">+ OpenAI Compatible</button>
          <button className="rounded bg-emerald-500/20 text-emerald-400 px-3 py-1 text-sm">+ Anthropic Compatible</button>
        </div>
      </section>
    </div>
  );
}
