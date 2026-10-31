import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { getUsage } from "@/lib/db";
import { estimateCost } from "@/lib/cost";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  
  const rows = getUsage();
  const now = Date.now();
  const windowMs = 5 * 60 * 60 * 1000; // 5 hours
  const windowStart = now - windowMs;
  
  const recentRows = rows.filter((r: any) => r.ts >= windowStart);
  const used = recentRows.reduce((sum: number, r: any) => sum + (r.tokens_in || 0) + (r.tokens_out || 0), 0);
  const rtkSaved = recentRows.reduce((sum: number, r: any) => sum + (r.rtk_saved || 0), 0);
  const limit = 100000; // 100k tokens per 5h
  
  const oldestInWindow = recentRows.length > 0 ? Math.min(...recentRows.map((r: any) => r.ts)) : now;
  const resetIn = Math.max(0, windowMs - (now - oldestInWindow));
  
  return Response.json({ 
    window: "5h", 
    used, 
    limit, 
    rtkSaved,
    requests: recentRows.length,
    resetIn,
    tokensIn: recentRows.reduce((sum: number, r: any) => sum + (r.tokens_in || 0), 0),
    tokensOut: recentRows.reduce((sum: number, r: any) => sum + (r.tokens_out || 0), 0),
  });
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  return Response.json({ ok: true, received: body });
}
