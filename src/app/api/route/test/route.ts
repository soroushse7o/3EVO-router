import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!(await validateSession(session))) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const { url, apiKey, model } = body || {};
  if (!url || !apiKey) {
    return Response.json({ ok: false, error: "url and apiKey required" }, { status: 400 });
  }
  const trimmed = url.replace(/\/$/, "");
  const host = new URL(trimmed).hostname;
  const { isSafeUrl } = await import("@/lib/ssrf");
  if (!await isSafeUrl(trimmed, [host])) {
    return Response.json({ ok: false, error: "blocked url" }, { status: 400 });
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const r = await fetch(url.replace(/\/$/, "") + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
      body: JSON.stringify({ model: model || "gpt-3.5-turbo", messages: [{ role: "user", content: "hi" }], max_tokens: 8 }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return Response.json({ ok: false, status: r.status, error: data.error?.message || data.error || "upstream error" });
    }
    const text = data.choices?.[0]?.message?.content || "";
    return Response.json({ ok: true, status: r.status, preview: text.slice(0, 64) });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || String(e) });
  }
}
