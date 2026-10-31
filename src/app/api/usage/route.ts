import { NextRequest } from "next/server";
import { z } from "zod";
import { recordUsage, getUsage } from "@/lib/db";
import { estimateCost } from "@/lib/cost";
import { validateSession } from "@/lib/auth";
const UsageSchema = z.object({ provider: z.string().optional(), model: z.string().optional(), tokens_in: z.coerce.number().int().nonnegative().optional(), tokens_out: z.coerce.number().int().nonnegative().optional(), rtk_saved: z.coerce.number().int().nonnegative().optional() });
export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rows = getUsage();
    const totalCost = rows.reduce((sum: number, r: any) => sum + estimateCost(r.model || "", r.tokens_in || 0, r.tokens_out || 0), 0);
    return Response.json({ rows, totalCost });
}
export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = UsageSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  const { provider, model, tokens_in, tokens_out, rtk_saved } = parsed.data;
  recordUsage(provider || "unknown", model || "unknown", tokens_in || 0, tokens_out || 0, rtk_saved || 0);
  return Response.json({ ok: true });
}
