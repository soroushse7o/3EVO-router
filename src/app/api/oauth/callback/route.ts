import { NextRequest } from "next/server";
import { upsertAccount } from "@/lib/accounts";
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const provider = searchParams.get("state") || "unknown";
  if (!code) return Response.json({ error: "missing code" }, { status: 400 });
  upsertAccount({ id: `${provider}-${Date.now()}`, provider, token: code, expiresAt: Date.now() + 3600000 });
  return Response.json({ ok: true, provider });
}
