import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import os from "os";

const file = path.join(os.homedir(), ".3evo", "mitm.json");

export async function POST(req: NextRequest) {
  if (process.env.EXPERIMENTAL_MITM !== "1") return Response.json({ error: "experimental feature disabled" }, { status: 403 });
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.consent) return Response.json({ error: "consent required" }, { status: 400 });
  const data = { enabled: !!body.enabled, allowlist: [] };
  if (existsSync(file)) {
    const existing = JSON.parse(readFileSync(file, "utf8"));
    data.allowlist = existing.allowlist || [];
  }
  writeFileSync(file, JSON.stringify(data, null, 2));
  return Response.json(data);
}
