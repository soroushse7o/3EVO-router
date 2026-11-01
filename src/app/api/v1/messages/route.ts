import { NextRequest } from "next/server";
import { runWithFallback, createProxyTier, streamWithFallback } from "@/lib/router";
import { recordUsage } from "@/lib/db";
import { validateApiKey } from "@/lib/api-key";
import { isSafeUrl } from "@/lib/ssrf";
import { logError, scrub } from "@/lib/logger";
import { getSortedAccounts, getAccountById } from "@/lib/accounts";
import { openaiToAnthropic, anthropicToOpenAI } from "@/lib/translator";
export async function POST(req: NextRequest) {
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  if (!key || !validateApiKey(key)) {
    return Response.json({ error: { message: "invalid api key", type: "auth_error" } }, { status: 401 });
  }
  const body = await req.json();
  const upstreamUrl = process.env.UPSTREAM_URL || "http://127.0.0.1:18434/v1/chat/completions";
  if (!isSafeUrl(upstreamUrl)) {
    return Response.json({ error: { message: "blocked url", type: "invalid_request_error" } }, { status: 400 });
  }
  const apiKey = process.env.LOCAL_MODEL_API_KEY;
  if (!apiKey) {
    return Response.json({ error: { message: "server misconfigured: LOCAL_MODEL_API_KEY is not set", type: "server_error" } }, { status: 500 });
  }
  const accounts = getSortedAccounts();
  const defaultUpstream = process.env.UPSTREAM_URL || "http://127.0.0.1:18434/v1/chat/completions";
  if (!isSafeUrl(defaultUpstream)) {
    return Response.json({ error: { message: "blocked url", type: "invalid_request_error" } }, { status: 400 });
  }

  const anthropicBody = {
    model: body.model || "Qwen2.5-14B-Instruct-Q4_K_M",
    max_tokens: body.max_tokens || 256,
    messages: body.messages || [],
    system: body.system,
    tools: body.tools,
    tool_choice: body.tool_choice,
    stream: body.stream ?? false,
  };
  const openaiBody = openaiToAnthropic(anthropicBody);

  const apiTiers = accounts.map(a => createProxyTier(a.id, openaiBody, apiKey));
  const defaultTier = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    req.signal?.addEventListener?.("abort", () => controller.abort());
    const r = await fetch(defaultUpstream, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey }, body: JSON.stringify(openaiBody), signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw { status: r.status, message: data.error?.message || data.error || "upstream error", type: data.error?.type || "upstream_error" };
    return data;
  };
  const tiers = [...apiTiers, defaultTier];

  if (body.stream) {
    const defaultStreamTier = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      req.signal?.addEventListener?.("abort", () => controller.abort());
      const r = await fetch(defaultUpstream, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey }, body: JSON.stringify({ ...openaiBody, stream: true }), signal: controller.signal });
      clearTimeout(timeoutId);
      if (!r.ok) {
        const err = await r.text();
        throw { status: r.status, message: scrub(err.slice(0, 200)), type: "upstream_error" };
      }
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const reader = r.body?.getReader();
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
                  if (delta) {
                    controller.enqueue(encoder.encode("data: " + JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: delta } }) + "\n\n"));
                  }
                } catch { }
              }
            }
          }
          controller.enqueue(encoder.encode("data: " + JSON.stringify({ type: "message_stop" }) + "\n\n"));
          controller.close();
        }
      });
      return { stream: readable };
    };
    const streamTiers = [
      ...accounts.map(a => async () => {
        const acc = getAccountById(a.id);
        if (!acc?.upstreamUrl) throw { status: 400, message: "no upstream for account" };
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        req.signal?.addEventListener?.("abort", () => controller.abort());
        const r = await fetch(acc.upstreamUrl, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey }, body: JSON.stringify({ ...openaiBody, stream: true }), signal: controller.signal });
        clearTimeout(timeoutId);
        if (!r.ok) {
          const err = await r.text().catch(() => ({}));
          throw { status: r.status, message: err || "upstream error", type: "upstream_error" };
        }
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            const reader = r.body?.getReader();
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
                    if (delta) {
                      controller.enqueue(encoder.encode("data: " + JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: delta } }) + "\n\n"));
                    }
                  } catch { }
                }
              }
            }
            controller.enqueue(encoder.encode("data: " + JSON.stringify({ type: "message_stop" }) + "\n\n"));
            controller.close();
          }
        });
        return { stream: readable };
      }),
      defaultStreamTier
    ];
    try {
      const result = await streamWithFallback(streamTiers, "messages:" + (req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"));
      return new Response(result.stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
    } catch (e: any) {
          logError("STREAM_ERROR", e);
          const status = e?.status || 503;
          return Response.json({ error: { message: scrub(e?.message || String(e)), type: "server_error" } }, { status });
        }
      }

      try {
        const result = await runWithFallback(tiers, "messages:" + (req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"), 30000);
        const anthropicResponse = anthropicToOpenAI(result);
        recordUsage(body.model || "unknown", "messages", anthropicResponse.usage?.prompt_tokens || 0, anthropicResponse.usage?.completion_tokens || 0, 0);
        return Response.json(anthropicResponse);
      } catch (e: any) {
        logError("ROUTE_ERROR", e);
        const status = e?.status || 503;
        return Response.json({ error: { message: scrub(e?.message || String(e)), type: "server_error" } }, { status });
      }
    }
export async function GET(req: NextRequest) {
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  if (!key || !validateApiKey(key)) {
    return Response.json({ error: "invalid api key" }, { status: 401 });
  }
  return Response.json({ ok: true });
}
