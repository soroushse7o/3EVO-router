import { NextRequest } from "next/server";
import crypto from "crypto";
import { ensureAuth, validatePassword, createSession, checkLockout, recordFailedAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  ensureAuth();
  const { password } = await req.json();
  if (!password) return Response.json({ error: "password required" }, { status: 400 });
  const lockout = checkLockout();
  if (lockout.locked) return Response.json({ error: "locked", until: lockout.until }, { status: 429 });
  if (!validatePassword(password)) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const attempt = recordFailedAuth(ip);
    if (attempt.locked) return Response.json({ error: "locked", until: attempt.until }, { status: 429 });
    return Response.json({ error: "invalid password", attempts: attempt.attempts || 0 }, { status: 401 });
  }
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
