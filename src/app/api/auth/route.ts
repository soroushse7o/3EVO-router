import { NextRequest } from "next/server";
import crypto from "crypto";
import { ensureAuth, validatePassword, createSession } from "@/lib/auth";
export async function POST(req: NextRequest) {
  ensureAuth();
  const { password } = await req.json();
  if (!password) return Response.json({ error: "password required" }, { status: 400 });
  if (!validatePassword(password)) return Response.json({ error: "invalid password" }, { status: 401 });
  const session = createSession();
  const res = Response.json({ ok: true });
  res.headers.set("Set-Cookie", `session=${session}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`);
  return res;
}
export async function DELETE(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  const res = Response.json({ ok: true });
  if (session) { import("@/lib/auth").then(m => m.destroySession(session)); }
  res.headers.set("Set-Cookie", "session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
  return res;
}
