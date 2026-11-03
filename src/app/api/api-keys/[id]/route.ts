import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { revokeApiKey } from "@/lib/api-key";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = req.cookies.get("session")?.value;
  if (!(await validateSession(session))) return Response.json({ error: "unauthorized" }, { status: 401 });
  await revokeApiKey(Number(id));
  return Response.json({ ok: true });
}
