import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { getToken } from "@/lib/oauth-flows";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { provider, account_id } = await req.json();
  
  const token = getToken(provider, account_id);
  if (!token) return Response.json({ verified: false, reason: "no token" });
  
  // In production: call provider API to validate token
  return Response.json({ verified: true, provider, account_id });
}
