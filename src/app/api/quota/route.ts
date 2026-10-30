import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json({ window: "5h", used: 0, limit: 100, resetIn: 0 });
}
export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  return Response.json({ ok: true, received: body });
}
