import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { createApiKey, listApiKeys, revokeApiKey } from "@/lib/api-key";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!(await validateSession(session))) return Response.json({ error: "unauthorized" }, { status: 401 });
  const keys = await listApiKeys();
  return Response.json(keys);
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!(await validateSession(session))) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = body?.name || "";
  const key = await createApiKey(name);
  return Response.json({ key, name });
}
