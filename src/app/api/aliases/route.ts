import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { listAliases, createAlias } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!session || !(await validateSession(session))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return Response.json(await listAliases());
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!session || !(await validateSession(session))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { alias, provider, model, fallback } = body || {};
  if (!alias || !provider || !model) {
    return Response.json({ error: "alias, provider, model required" }, { status: 400 });
  }
  await createAlias(alias, provider, model, fallback || []);
  return Response.json({ ok: true });
}
