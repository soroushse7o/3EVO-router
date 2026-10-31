import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import os from "os";

const dir = path.join(os.homedir(), ".3evo");

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  
  const allowed = new Set(["settings.json", "proxy-pools.json", "mitm.json", "quota.json"]);
  mkdirSync(dir, { recursive: true });
  for (const file of Object.keys(body)) {
    if (!allowed.has(file)) continue;
    if (file.includes("..") || file.includes("/") || file.includes("\\")) continue;
    writeFileSync(path.join(dir, file), JSON.stringify(body[file], null, 2));
  }
  return Response.json({ ok: true });
}
