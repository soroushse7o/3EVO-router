import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { hashPassword, validatePassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) return Response.json({ error: "currentPassword and newPassword required" }, { status: 400 });
  if (newPassword.length < 8) return Response.json({ error: "newPassword must be at least 8 chars" }, { status: 400 });

  // This route is intentionally OUTSIDE session middleware (configured in proxy/middleware)
  // so a locked-out admin can still reset via a direct curl with the known password.
  if (!validatePassword(currentPassword)) return Response.json({ error: "invalid current password" }, { status: 401 });

  const { hash, salt } = hashPassword(newPassword);
  const db = (await import("@/lib/db")).getAdapterSync();
  db.run(`INSERT INTO auth(id, password_hash, salt) VALUES(1, ?, ?) ON CONFLICT(id) DO UPDATE SET password_hash = excluded.password_hash, salt = excluded.salt`, [hash, salt]);
  return Response.json({ ok: true });
}
