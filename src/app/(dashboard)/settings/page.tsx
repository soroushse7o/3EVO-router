"use client";
import { useState } from "react";
export default function SettingsPage(){
  const [rtk,setRtk]=useState(true);
  const [lang,setLang]=useState("en");
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <label className="flex items-center justify-between"><span>RTK compression</span><input type="checkbox" checked={rtk} onChange={e=>setRtk(e.target.checked)} /></label>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <label className="flex items-center justify-between"><span>Language</span>
          <select value={lang} onChange={e=>setLang(e.target.value)} className="bg-black/30 border border-white/10 rounded px-2 py-1">
            <option value="en">English</option><option value="fa">فارسی</option>
          </select>
        </label>
      </div>
    </div>
  );
}
