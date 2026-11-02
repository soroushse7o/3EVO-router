import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
export async function GET(_req: NextRequest) {
  return Response.json({ status: "ok", time: Date.now() });
}
