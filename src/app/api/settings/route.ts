import { NextRequest } from "next/server";
import { getSettings, saveSettings } from "@/lib/db";
import { validateSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!session || !(await validateSession(session))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const settings = await getSettings();
  return Response.json(settings);
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!session || !(await validateSession(session))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const merged = await saveSettings(body);
  return Response.json(merged);
}
