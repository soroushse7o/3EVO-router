import { NextRequest, NextResponse } from "next/server";
import {
  getOAuthConnection,
  deleteOAuthConnection,
  revokeOAuthConnection,
} from "@/lib/oauth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conn = await getOAuthConnection(Number(params.id));
  if (!conn) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(conn);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "delete";

  if (action === "revoke") {
    await revokeOAuthConnection(Number(params.id));
    return NextResponse.json({ ok: true });
  }

  await deleteOAuthConnection(Number(params.id));
  return NextResponse.json({ ok: true });
}

async function getSession(request: NextRequest): Promise<{ id: string } | null> {
  const sessionId = request.cookies.get("session")?.value;
  if (!sessionId) return null;
  const db = await getAdapter();
  const session = db.get("SELECT id FROM sessions WHERE id = ? AND expires_at > ?", [
    sessionId,
    Date.now(),
  ]);
  return session ? { id: session.id } : null;
}

async function getAdapter() {
  const { getAdapter } = await import("@/lib/db/driver");
  return getAdapter();
}
