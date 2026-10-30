"use client";
import { useEffect, useState } from "react";
export default function ConsoleLogPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [level, setLevel] = useState("all");
  useEffect(() => {
    const es = new EventSource("/api/log/stream");
    es.onmessage = (e) => setLogs(l => [...l.slice(-200), e.data]);
    return () => es.close();
  }, []);
  const visible = logs.filter(l => {
    if (level !== "all" && !l.toLowerCase().includes(level)) return false;
    if (filter && !l.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Console Log</h1>
      <div className="flex gap-2 mb-2">
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="search" className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs" />
        <select value={level} onChange={e=>setLevel(e.target.value)} className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs">
          <option value="all">All</option><option value="error">Error</option><option value="warn">Warn</option><option value="info">Info</option>
        </select>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-xs h-64 overflow-auto">
        {visible.map((l,i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}
