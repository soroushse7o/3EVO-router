import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/api-key";
export async function GET(req: NextRequest) {
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  if (!key || !validateApiKey(key)) {
    return Response.json({ error: "invalid api key" }, { status: 401 });
  }
  return Response.json({ data: [{ id: "premium-coding", object: "model" }], object: "list" });
}
