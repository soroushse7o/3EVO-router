import { NextRequest } from "next/server";
import { buildProviderTiers, runWithFallback } from "@/lib/router";
import { recordUsage } from "@/lib/db";
import { validateApiKey } from "@/lib/api-key";
import { logError } from "@/lib/logger";
import { scrub } from "@/lib/scrubber";
import { checkRateLimit } from "@/lib/rateLimit";
import { anthropicToOpenAI } from "@/lib/translator";

export async function POST(req: NextRequest) {
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  if (!key || !validateApiKey(key)) {
    return Response.json({ error: { message: "invalid api key", type: "auth_error" } }, { status: 401 });
  }
  if (!checkRateLimit(key)) return Response.json({ error: { message: "rate limit exceeded", type: "rate_limit_error" } }, { status: 429 });

  const body = await req.json();
  const { nonStream, stream: streamTiers } = await buildProviderTiers(body, req.signal);
  if (!nonStream.length && !streamTiers.length) {
    return Response.json({ error: { message: "no providers configured", type: "server_error" } }, { status: 503 });
  }

  if (body.stream) {
    try {
      const result = await (await import("@/lib/router")).streamWithFallback(streamTiers, `messages:${req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"}`);
      const readable = result.stream;
      return new Response(readable, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
    } catch (e: any) {
      logError("STREAM_ERROR", scrub(e?.message || String(e)));
      const status = e?.status || 503;
      return Response.json({ error: { message: scrub(e?.message || String(e)), type: "server_error" } }, { status });
    }
  }

  try {
    const result = await runWithFallback(nonStream, `messages:${req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"}`);
    const data = anthropicToOpenAI(result.data || result);
    return Response.json(data, { status: 200 });
  } catch (e: any) {
    logError("CHAT_ERROR", scrub(e?.message || String(e)));
    const status = e?.status || 503;
    return Response.json({ error: { message: scrub(e?.message || String(e)), type: "server_error" } }, { status });
  }
}
