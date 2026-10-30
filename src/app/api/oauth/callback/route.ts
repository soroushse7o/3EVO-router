import { NextRequest } from "next/server";
import { upsertAccount } from "@/lib/accounts";
import { validateState } from "../start/route";
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const providerEntry = state ? validateState(state) : null;
  const provider = providerEntry?.provider || searchParams.get("state") || "unknown";
  if (!code) return Response.json({ error: "missing code" }, { status: 400 });
  if (!state || !providerEntry) return Response.json({ error: "invalid or expired state" }, { status: 400 });
  // TODO: exchange code for real access token with provider
  // For now we store a placeholder; replace with actual token exchange
  const token = `stub-${code}`;
  upsertAccount({ id: `${provider}-${Date.now()}`, provider, token, expiresAt: Date.now() + 3600000 });
  return Response.json({ ok: true, provider });
}
