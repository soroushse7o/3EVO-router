import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json({ status: "ok", time: Date.now() });
}
