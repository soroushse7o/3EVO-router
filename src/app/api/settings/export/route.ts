import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { readFileSync, existsSync } from "fs";
import path from "path";
import os from "os";

const dir = path.join(os.homedir(), ".3evo");

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  
  const files = ["settings.json", "api-keys.json", "accounts.json.enc", "sessions.json", "mitm.json", "proxy-pools.json"];
  const exportData: Record<string, any> = {};
  for (const f of files) {
    const fp = path.join(dir, f);
    if (existsSync(fp)) {
      try { exportData[f] = JSON.parse(readFileSync(fp, "utf8")); } catch {}
    }
  }
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  return new Response(blob, {
    headers: { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="3evo-backup.json"' },
  });
}
