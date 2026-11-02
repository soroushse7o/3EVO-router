import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { getRecentLogs } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const limit = Number(req.nextUrl.searchParams.get("limit") || 100);
  return Response.json({ logs: getRecentLogs(limit) });
}
