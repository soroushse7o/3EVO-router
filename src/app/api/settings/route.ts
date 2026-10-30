import { NextRequest } from "next/server";
import { z } from "zod";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import os from "os";
import { validateSession } from "@/lib/auth";
const dir = path.join(os.homedir(), ".3evo");
mkdirSync(dir, { recursive: true });
const file = path.join(dir, "settings.json");
const SettingsSchema = z.object({ port: z.string().optional(), baseUrl: z.string().url().optional(), secretPath: z.string().min(16).max(32).optional(), dataDir: z.string().optional() });
export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!existsSync(file)) return Response.json({ port: process.env.PORT || "20128", baseUrl: process.env.BASE_URL || "http://localhost:20128", secretPath: process.env.SECRET_PATH || "", dataDir: process.env.DATA_DIR || "~/.3evo" });
  return Response.json(JSON.parse(readFileSync(file, "utf8")));
}
export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = SettingsSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  writeFileSync(file, JSON.stringify(parsed.data, null, 2));
  return Response.json({ ok: true });
}
