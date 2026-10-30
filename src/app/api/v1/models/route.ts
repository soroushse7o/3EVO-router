import { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/api-key";
export async function GET(req: NextRequest) {
  requireApiKey(req);
  return Response.json({ data: [{ id: "premium-coding", object: "model" }], object: "list" });
}
