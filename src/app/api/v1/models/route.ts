import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/api-key";
export async function GET(req: NextRequest) {
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  if (!key || !(await validateApiKey(key))) {
    return Response.json({ error: "invalid api key" }, { status: 401 });
  }
  const { listAliases } = await import("@/lib/db");
  const aliases = (await listAliases()) as Array<{ alias: string }>;
  const ids = new Set<string>(["premium-coding", ...aliases.map((a) => a.alias)]);
  return Response.json({ data: [...ids].map((id) => ({ id, object: "model" })), object: "list" });
}
