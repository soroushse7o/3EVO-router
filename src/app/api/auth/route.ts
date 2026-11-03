import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { ensureAuth, validatePassword, recordFailedAuth, checkLockout, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await ensureAuth();
  const { password } = await req.json();
  if (!password) return Response.json({ error: "password required" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const lock = await checkLockout(ip);
  if (lock.locked) return Response.json({ error: "locked", until: lock.until }, { status: 429 });

  if (!(await validatePassword(password))) {
    const attempt = await recordFailedAuth(ip);
    if (attempt.locked) return Response.json({ error: "locked", until: attempt.until }, { status: 429 });
    return Response.json({ error: "invalid password", attempts: attempt.attempts || 0 }, { status: 401 });
  }

  const session = await createSession();
  const res = Response.json({ ok: true });
  res.headers.set("Set-Cookie", `session=${session}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`);
  return res;
}
