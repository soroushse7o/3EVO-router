import { NextRequest } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import os from "os";
const dir = path.join(os.homedir(), ".3evo");
mkdirSync(dir, { recursive: true });
const file = path.join(dir, "settings.json");
export async function GET() {
  if (!existsSync(file)) return Response.json({ port: process.env.PORT || "20128", baseUrl: process.env.BASE_URL || "http://localhost:20128", secretPath: process.env.SECRET_PATH || "", dataDir: process.env.DATA_DIR || "~/.3evo" });
  return Response.json(JSON.parse(readFileSync(file, "utf8")));
}
export async function POST(req: NextRequest) {
  const body = await req.json();
  writeFileSync(file, JSON.stringify(body, null, 2));
  return Response.json({ ok: true });
}
