import { NextRequest } from "next/server";
import { buildProviderTiers, runWithFallback, streamWithFallback } from "@/lib/router";
import { recordUsage } from "@/lib/db";
import { validateApiKey } from "@/lib/api-key";
import { logError } from "@/lib/logger";
import { scrub } from "@/lib/scrubber";

export async function GET(req: NextRequest) {
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  if (!key || !validateApiKey(key)) return Response.json({ error: "invalid api key" }, { status: 401 });
  return Response.json({ data: [{ id: "premium-coding", object: "model", owned_by: "local" }], object: "list" });
}

export async function POST(req: NextRequest) {
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  if (!key || !validateApiKey(key)) return Response.json({ error: { message: "invalid api key", type: "auth_error" } }, { status: 401 });

  const body = await req.json();
  const { nonStream, stream } = await buildProviderTiers(body, req.signal);

  if (body.stream) {
    try {
      const result = await streamWithFallback(stream, `chat:${req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"}`);
      const readable = result.stream;
      return new Response(readable, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    } catch (e: any) {
      logError("STREAM_ERROR", e);
      const status = e?.status || 503;
      return Response.json({ error: { message: scrub(e?.message || String(e)), type: "server_error" } }, { status });
    }
  }

  try {
    const resolved = await runWithFallback(nonStream, `chat:${req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"}`, 30000);
    const result = resolved.data;
    recordUsage(resolved.provider || "unknown", body.model || "unknown", result.usage?.prompt_tokens || 0, result.usage?.completion_tokens || 0, 0);
    return Response.json(result);
  } catch (e: any) {
    logError("ROUTE_ERROR", e);
    const status = e?.status || 503;
    return Response.json({ error: { message: scrub(e?.message || String(e)), type: "server_error" } }, { status });
  }
}
