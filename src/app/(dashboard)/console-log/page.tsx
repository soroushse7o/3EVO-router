"use client";
import { useEffect, useState } from "react";
export default function ConsoleLogPage() {
  const [logs, setLogs] = useState<string[]>([]);
  useEffect(() => {
    const es = new EventSource("/api/log/stream");
    es.onmessage = (e) => setLogs(l => [...l.slice(-50), e.data]);
    return () => es.close();
  }, []);
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Console Log</h1>
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-xs h-64 overflow-auto">
        {logs.map((l,i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}
