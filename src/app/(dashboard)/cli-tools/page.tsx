"use client";
export default function CliToolsPage() {
  const clients = ["Claude Code","Cursor","Cline","Codex","OpenClaw"];
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">CLI Tools</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {clients.map(c => (
          <div key={c} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-medium">{c}</div>
            <div className="text-xs text-gray-500 mt-1">Detect + generate config (backup, diff, undo)</div>
            <button className="mt-2 text-xs rounded bg-white/10 px-2 py-1">Generate</button>
          </div>
        ))}
      </div>
    </div>
  );
}
