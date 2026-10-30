import { NextRequest } from "next/server";
import { recordUsage, getUsage } from "@/lib/db";
export async function GET() {
  return Response.json({ rows: getUsage() });
}
export async function POST(req: NextRequest) {
  const { provider, model, tokens_in, tokens_out, rtk_saved } = await req.json();
  recordUsage(provider, model, tokens_in || 0, tokens_out || 0, rtk_saved || 0);
  return Response.json({ ok: true });
}
