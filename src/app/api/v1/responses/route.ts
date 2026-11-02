import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/api-key";

export async function POST(req: NextRequest) {
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  if (!key || !validateApiKey(key)) {
    return Response.json({ error: { message: "invalid api key", type: "auth_error" } }, { status: 401 });
  }
  return Response.json({ error: { message: "/v1/responses is not implemented in v0.1", type: "not_implemented" } }, { status: 503 });
}
