import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { isSafeUrl } from "@/lib/ssrf";
import { createProvider, listProviders } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json(listProviders());
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const { name, baseUrl, apiKey, model, priceIn, priceOut } = body || {};
  if (!name || !baseUrl || !apiKey) {
    return Response.json({ error: "name, baseUrl, apiKey required" }, { status: 400 });
  }
  const trimmed = baseUrl.replace(/\/$/, "");
  const host = new URL(trimmed).hostname;
  if (!await isSafeUrl(trimmed, [host])) {
    return Response.json({ error: "blocked url" }, { status: 400 });
  }
  createProvider(name, trimmed, apiKey, model || "gpt-3.5-turbo", Number(priceIn) || 0, Number(priceOut) || 0);
  return Response.json({ ok: true });
}
