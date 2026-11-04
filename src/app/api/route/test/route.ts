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
    let controller = new AbortController();
    let timeoutId = setTimeout(() => controller.abort(), 15000);
    const trimmedUrl = url.replace(/\/$/, "");
    const paths = ["/chat/completions", "/v1/chat/completions"];
    let r = await fetch(trimmedUrl + paths[0], {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
      body: JSON.stringify({ model: model || "gpt-3.5-turbo", messages: [{ role: "user", content: "hi" }], max_tokens: 8 }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!r.ok && paths[1]) {
      controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 15000);
      r = await fetch(trimmedUrl + paths[1], {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
        body: JSON.stringify({ model: model || "gpt-3.5-turbo", messages: [{ role: "user", content: "hi" }], max_tokens: 8 }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    }
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
