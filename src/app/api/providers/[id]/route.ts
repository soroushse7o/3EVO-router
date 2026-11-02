import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { deleteProvider } from "@/lib/db";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  deleteProvider(Number(id));
  return Response.json({ ok: true });
}
