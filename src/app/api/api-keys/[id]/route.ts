import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { revokeApiKey } from "@/lib/api-key";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  revokeApiKey(Number(params.id));
  return Response.json({ ok: true });
}
