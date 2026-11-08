import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { isSafeUrl } from "@/lib/ssrf";
import { createProvider, listProviders } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!(await validateSession(session))) return Response.json({ error: "unauthorized" }, { status: 401 });
  // Shape matches what the dashboard expects; the encrypted key is never sent to the client.
  return Response.json(
    listProviders().map((r: any) => ({
      id: r.id,
      name: r.name,
      baseUrl: r.base_url,
      model: r.model,
      priceIn: r.price_per_1k_in,
      priceOut: r.price_per_1k_out,
      created: r.created,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!(await validateSession(session))) return Response.json({ error: "unauthorized" }, { status: 401 });
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
