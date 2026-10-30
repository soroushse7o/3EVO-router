import { NextRequest } from "next/server";
import crypto from "crypto";
import { validateSession } from "@/lib/auth";
const states = new Map<string, { provider: string; created: number }>();
export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { provider } = await req.json();
  const state = crypto.randomBytes(16).toString("hex");
  states.set(state, { provider, created: Date.now() });
  // In production: replace with real provider auth URL
  const authUrl = `https://example.com/oauth/${provider}?state=${state}`;
  return Response.json({ provider, authUrl, state });
}
export function validateState(state: string): { provider: string } | null {
  const entry = states.get(state);
  if (!entry) return null;
  if (Date.now() - entry.created > 600000) { states.delete(state); return null; }
  states.delete(state);
  return { provider: entry.provider };
}
