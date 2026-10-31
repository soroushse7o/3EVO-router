import { NextRequest } from "next/server";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  const resetToken = process.env.AUTH_RESET_TOKEN;
  if (!resetToken || token !== resetToken) {
    return Response.json({ error: "invalid reset token" }, { status: 403 });
  }
  if (!password || password.length < 8) {
    return Response.json({ error: "password must be at least 8 chars" }, { status: 400 });
  }
  const { hash, salt } = hashPassword(password);
  const fs = require("fs");
  const path = require("path");
  const os = require("os");
  const dir = path.join(os.homedir(), ".3evo");
  fs.mkdirSync(dir, { recursive: true });
  const authFile = path.join(dir, "auth.json");
  fs.writeFileSync(authFile, JSON.stringify({ passwordHash: hash, salt }, null, 2));
  return Response.json({ ok: true });
}
