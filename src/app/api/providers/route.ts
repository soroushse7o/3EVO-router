import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { isSafeUrl } from "@/lib/ssrf";
import fs from "fs";
import path from "path";
import { DATA_DIR } from "@/lib/paths";

const file = path.join(DATA_DIR, "custom-providers.json");

function readProviders() {
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return []; }
}

function writeProviders(list: any[]) {
  fs.writeFileSync(file, JSON.stringify(list, null, 2));
}

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json(readProviders());
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const { name, baseUrl, apiKey, model } = body || {};
  if (!name || !baseUrl || !apiKey) {
    return Response.json({ error: "name, baseUrl, apiKey required" }, { status: 400 });
  }
  const trimmed = baseUrl.replace(/\/$/, "");
  const host = new URL(trimmed).hostname;
  if (!await isSafeUrl(trimmed, [host])) {
    return Response.json({ error: "blocked url" }, { status: 400 });
  }
  const list = readProviders();
  const existing = list.findIndex((p: any) => p.name === name);
  const entry = { name, baseUrl: trimmed, apiKey, model: model || "gpt-3.5-turbo", createdAt: Date.now() };
  if (existing >= 0) list[existing] = entry; else list.push(entry);
  writeProviders(list);
  return Response.json(entry);
}
