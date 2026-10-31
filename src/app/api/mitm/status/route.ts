import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { readFileSync, existsSync } from "fs";
import path from "path";
import os from "os";

const file = path.join(os.homedir(), ".3evo", "mitm.json");

export async function GET(req: NextRequest) {
  if (process.env.EXPERIMENTAL_MITM !== "1") return Response.json({ error: "experimental feature disabled" }, { status: 403 });
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!existsSync(file)) return Response.json({ enabled: false, allowlist: [] });
  return Response.json(JSON.parse(readFileSync(file, "utf8")));
}
