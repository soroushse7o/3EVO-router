import { NextRequest } from "next/server";
import { buildProviderTiers, runWithFallback } from "@/lib/router";
import { recordUsage } from "@/lib/db";
import { validateApiKey } from "@/lib/api-key";
import { logError } from "@/lib/logger";
import { scrub } from "@/lib/scrubber";
import { anthropicToOpenAI } from "@/lib/translator";

export async function POST(req: NextRequest) {
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  if (!key || !validateApiKey(key)) {
    return Response.json({ error: { message: "invalid api key", type: "auth_error" } }, { status: 401 });
  }
  const body = await req.json();
  const { nonStream, stream: streamTiers } = await buildProviderTiers(body, req.signal);
  if (!nonStream.length && !streamTiers.length) {
    return Response.json({ error: { message: "no providers configured", type: "server_error" } }, { status: 503 });
  }

  if (body.stream) {
    try {
      const result = await (await import("@/lib/router")).streamWithFallback(streamTiers, `messages:${req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"}`);
      return new Response(result.stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
    } catch (e: any) {
      logError("STREAM_ERROR", e);
      const status = e?.status || 503;
      return Response.json({ error: { message: scrub(e?.message || String(e)), type: "server_error" } }, { status });
    }
  }

  try {
    const resolved = await runWithFallback(nonStream, `messages:${req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"}`, 30000);
    const anthropicResponse = anthropicToOpenAI(resolved.data);
    recordUsage(resolved.provider || "unknown", body.model || "unknown", anthropicResponse.usage?.prompt_tokens || 0, anthropicResponse.usage?.completion_tokens || 0, 0);
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
