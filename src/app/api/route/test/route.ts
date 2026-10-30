import { NextRequest } from "next/server";
import { runWithFallback } from "@/lib/router";
export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await runWithFallback(body);
  return Response.json(result);
}
