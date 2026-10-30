import { NextRequest } from "next/server";
import { runWithFallback } from "@/lib/router";
export async function GET() {
  return Response.json({ data: [{ id: "combo/premium-coding", object: "model" }] });
}
export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const result = await runWithFallback(body);
    return Response.json(result);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
