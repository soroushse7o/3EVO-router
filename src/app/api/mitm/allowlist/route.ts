import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import os from "os";

const file = path.join(os.homedir(), ".3evo", "mitm.json");

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const data = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { enabled: false, allowlist: [] };
  if (!data.allowlist.includes(body.host)) data.allowlist.push(body.host);
  writeFileSync(file, JSON.stringify(data, null, 2));
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const host = searchParams.get("host");
  if (!host) return Response.json({ error: "host required" }, { status: 400 });
  const data = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { enabled: false, allowlist: [] };
  data.allowlist = data.allowlist.filter((h: string) => h !== host);
  writeFileSync(file, JSON.stringify(data, null, 2));
  return Response.json({ ok: true });
}
