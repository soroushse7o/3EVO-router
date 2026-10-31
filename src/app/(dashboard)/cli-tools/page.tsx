"use client";
import { useEffect, useState } from "react";

const CLIENTS = [
  { name: "Claude Code", config: "~/.claude/settings.json", template: { apiKey: "3EVO_API_KEY", baseURL: "http://localhost:20128/v1" } },
  { name: "Cursor", config: "~/.cursor/config.json", template: { apiKey: "3EVO_API_KEY", endpoint: "http://localhost:20128/v1/chat/completions" } },
  { name: "Cline", config: "~/.cline/config.json", template: { apiKey: "3EVO_API_KEY", baseUrl: "http://localhost:20128/v1" } },
  { name: "Codex", config: "~/.codex/config.json", template: { apiKey: "3EVO_API_KEY", endpoint: "http://localhost:20128/v1/chat/completions" } },
  { name: "OpenClaw", config: "~/.openclaw/config.json", template: { apiKey: "3EVO_API_KEY", endpoint: "http://localhost:20128/v1" } },
];

export default function CliToolsPage() {
  const [installed, setInstalled] = useState<Record<string, boolean>>({});
  const [generated, setGenerated] = useState<Record<string, string>>({});

  useEffect(() => {
    const detected: Record<string, boolean> = {};
    CLIENTS.forEach(c => { detected[c.name] = false; });
    setInstalled(detected);
  }, []);

  const generate = (client: typeof CLIENTS[0]) => {
    const config = JSON.stringify(client.template, null, 2);
    setGenerated(g => ({ ...g, [client.name]: config }));
  };

  const download = (client: typeof CLIENTS[0]) => {
    const blob = new Blob([generated[client.name] || ""], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = client.config.split("/").pop() || "config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">CLI Tools</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CLIENTS.map(c => (
          <div key={c.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-medium">{c.name}</div>
            <div className="text-xs text-gray-400 mt-1">Config: {c.config}</div>
            <div className="text-xs mt-1">{installed[c.name] ? <span className="text-emerald-400">Installed</span> : <span className="text-gray-500">Not detected</span>}</div>
            <div className="flex gap-2 mt-2">
              <button className="text-xs rounded bg-emerald-500/20 text-emerald-400 px-2 py-1" onClick={() => generate(c)}>Generate</button>
              {generated[c.name] && <button className="text-xs rounded bg-white/10 px-2 py-1" onClick={() => download(c)}>Download</button>}
            </div>
            {generated[c.name] && (
              <pre className="mt-2 p-2 rounded bg-black/30 text-xs overflow-x-auto">{generated[c.name]}</pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
