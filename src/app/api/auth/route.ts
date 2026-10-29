import { NextRequest } from "next/server";
import crypto from "crypto";
export async function POST(req: NextRequest) {
  const { password } = await req.json();
  // Simple demo auth: accept any non-empty password, set session cookie
  if (!password) return Response.json({ error: "password required" }, { status: 400 });
  const session = crypto.randomBytes(32).toString("hex");
  const res = Response.json({ ok: true });
  res.headers.set("Set-Cookie", `session=${session}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`);
  return res;
}
export async function DELETE() {
  const res = Response.json({ ok: true });
  res.headers.set("Set-Cookie", "session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
  return res;
}
