import { NextRequest, NextResponse } from "next/server";
import { getOAuthConnection, deleteOAuthConnection, revokeOAuthConnection } from "@/lib/oauth";
import { validateSession } from "@/lib/auth";

function getSessionToken(request: NextRequest): string | undefined {
  return request.cookies.get("session")?.value;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await validateSession(getSessionToken(request)))) {
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
  if (!(await validateSession(getSessionToken(request)))) {
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
