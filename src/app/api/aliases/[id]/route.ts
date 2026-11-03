import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { deleteAlias } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = _req.cookies.get("session")?.value;
  if (!session || !(await validateSession(session))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await deleteAlias(id);
  return Response.json({ ok: true });
}
