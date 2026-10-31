import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { url, token } = await req.json();
  if (!url || !token) return Response.json({ error: "url and token required" }, { status: 400 });
  
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ syncedAt: Date.now() }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return Response.json({ error: `sync failed ${r.status}` }, { status: 502 });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: "sync timeout or network error" }, { status: 502 });
  }
}
