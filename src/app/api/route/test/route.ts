import { NextRequest } from "next/server";
import { runWithFallback } from "@/lib/router";
import { validateSession } from "@/lib/auth";
export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const result = await runWithFallback(body);
  return Response.json(result);
}
