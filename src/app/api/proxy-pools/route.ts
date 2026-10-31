import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import os from "os";

const file = path.join(os.homedir(), ".3evo", "proxy-pools.json");

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!existsSync(file)) return Response.json([]);
  return Response.json(JSON.parse(readFileSync(file, "utf8")));
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const pools = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
  const pool = { id: Date.now().toString(), name: body.name, url: body.url, strategy: body.strategy || "round-robin", active: true, createdAt: Date.now() };
  pools.push(pool);
  writeFileSync(file, JSON.stringify(pools, null, 2));
  return Response.json(pool);
}

export async function DELETE(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const pools = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
  const filtered = pools.filter((p: any) => p.id !== id);
  writeFileSync(file, JSON.stringify(filtered, null, 2));
  return Response.json({ ok: true });
}
