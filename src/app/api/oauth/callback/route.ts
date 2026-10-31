import { NextRequest } from "next/server";
import crypto from "crypto";
import { validateSession } from "@/lib/auth";
import { pollDeviceCode, refreshToken, getToken } from "@/lib/oauth-flows";
const states = new Map<string, { provider: string; created: number }>();
export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { provider, device_code, code, state, account_id } = await req.json();
  
  // Device code flow completion
  if (device_code) {
    const result = await pollDeviceCode(provider, device_code);
    return Response.json({ flow: "device", ...result });
  }
  
  // Redirect flow
  if (state) {
    const entry = states.get(state);
    if (!entry || entry.provider !== provider) {
      return Response.json({ error: "invalid state" }, { status: 400 });
    }
    states.delete(state);
    return Response.json({ flow: "redirect", provider, status: "complete", token: "tok_" + crypto.randomUUID() });
  }
  
  return Response.json({ error: "missing parameters" }, { status: 400 });
}
export async function refresh(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { provider, account_id } = await req.json();
  const token = await refreshToken(provider, account_id || "");
  if (!token) return Response.json({ error: "no account" }, { status: 404 });
  return Response.json({ token });
}
export function validateState(state: string): { provider: string } | null {
  const entry = states.get(state);
  if (!entry) return null;
  if (Date.now() - entry.created > 600000) { states.delete(state); return null; }
  states.delete(state);
  return { provider: entry.provider };
}
