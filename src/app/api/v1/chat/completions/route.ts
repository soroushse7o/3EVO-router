import { NextRequest } from "next/server";
import { runWithFallback } from "@/lib/router";
import { recordUsage } from "@/lib/db";
import { validateApiKey } from "@/lib/api-key";
export async function GET(req: NextRequest) {
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  if (!key || !validateApiKey(key)) {
    return Response.json({ error: "invalid api key" }, { status: 401 });
  }
  return Response.json({ data: [{ id: "qwen2.5-14b", object: "model", owned_by: "local" }] });
}
export async function POST(req: NextRequest) {
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  if (!key || !validateApiKey(key)) {
    return Response.json({ error: "invalid api key" }, { status: 401 });
  }
  const body = await req.json();
  const upstreamUrl = "http://127.0.0.1:18435/v1/chat/completions";
  if (body.stream) {
    const upstream = await fetch(upstreamUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, stream: true }) });
    if (!upstream.ok) {
      const err = await upstream.text();
      return Response.json({ error: err }, { status: upstream.status });
    }
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = upstream.body?.getReader();
        if (!reader) { controller.close(); return; }
        const dec = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += dec.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data:")) {
              const payload = line.slice(5).trim();
              if (payload === "[DONE]") { controller.enqueue(encoder.encode("data: [DONE]\n\n")); continue; }
              try {
                const json = JSON.parse(payload);
                const delta = json.choices?.[0]?.delta?.content || "";
                if (delta && /[a-zA-Z0-9]/.test(delta)) recordUsage(body.model || "unknown", "stream", 0, delta.length, 0);
                controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
              } catch { /* skip malformed */ }
            }
          }
        }
        controller.close();
      }
    });
    return new Response(readable, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
  }
  const result = await runWithFallback([async () => {
    const r = await fetch(upstreamUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok) throw { status: r.status, message: data.error?.message || data.error || "upstream error" };
    recordUsage(body.model || "unknown", "chat", data.usage?.prompt_tokens || 0, data.usage?.completion_tokens || 0, 0);
    return data;
  }], `chat:${req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"}`);
  return Response.json(result);
}
