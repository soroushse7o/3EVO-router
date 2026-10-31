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
  
  mkdirSync(dir, { recursive: true });
  const skip = ["accounts.json.enc", "api-keys.json"];
  for (const [file, data] of Object.entries(body)) {
    if (skip.includes(file)) continue;
    if (file.endsWith(".json")) {
      writeFileSync(path.join(dir, file), JSON.stringify(data, null, 2));
    }
  }
  return Response.json({ ok: true });
}
