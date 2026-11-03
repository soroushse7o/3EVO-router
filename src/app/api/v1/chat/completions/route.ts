import { NextRequest } from "next/server";
import { buildProviderTiers, runWithFallback, streamWithFallback } from "@/lib/router";
import { recordUsage } from "@/lib/db";
import { validateApiKey } from "@/lib/api-key";
import { logError } from "@/lib/logger";
import { scrub } from "@/lib/scrubber";
import { checkRateLimit } from "@/lib/rateLimit";
import { checkBudget } from "@/lib/budget";
import { estimateCost } from "@/lib/cost";
import { recordRouteRequest } from "@/lib/instrumentation";

export async function GET(req: NextRequest) {
  const start = Date.now();
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  if (!key || !validateApiKey(key)) {
    recordRouteRequest("/v1/chat/completions", Date.now() - start, true);
    return Response.json({ error: "invalid api key" }, { status: 401 });
  }
  recordRouteRequest("/v1/chat/completions", Date.now() - start);
  return Response.json({ data: [{ id: "premium-coding", object: "model", owned_by: "local" }], object: "list" });
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  if (!key || !validateApiKey(key)) {
    recordRouteRequest("/v1/chat/completions", Date.now() - start, true);
    return Response.json({ error: { message: "invalid api key", type: "auth_error" } }, { status: 401 });
  }
  if (!checkRateLimit(key)) {
    recordRouteRequest("/v1/chat/completions", Date.now() - start, true);
    return Response.json({ error: { message: "rate limit exceeded", type: "rate_limit_error" } }, { status: 429 });
  }

  const body = await req.json();
  const { nonStream, stream } = await buildProviderTiers(body, req.signal);

  if (body.stream) {
    try {
      const result = await streamWithFallback(stream, `chat:${req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"}`);
      const readable = result.stream;
      recordRouteRequest("/v1/chat/completions", Date.now() - start);
      return new Response(readable, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    } catch (e: any) {
      logError("STREAM_ERROR", e);
      recordRouteRequest("/v1/chat/completions", Date.now() - start, true);
      const status = e?.status || 503;
      return Response.json({ error: { message: scrub(e?.message || String(e)), type: "server_error" } }, { status });
    }
  }

  try {
    const resolved = await runWithFallback<any>(nonStream, `chat:${req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"}`, 30000);
    const provider = resolved.provider || "unknown";
    const model = body.model || "unknown";
    const tokensIn = resolved.data.usage?.prompt_tokens || 0;
    const tokensOut = resolved.data.usage?.completion_tokens || 0;
    const cost = estimateCost(model, tokensIn, tokensOut, provider);

    const budget = await checkBudget(provider, model, tokensIn, tokensOut);
    if (budget.exceeded) {
      recordRouteRequest("/v1/chat/completions", Date.now() - start, true);
      return Response.json({ error: { message: `monthly budget exceeded (remaining: $${budget.remaining?.toFixed(2)})`, type: "budget_exceeded" } }, { status: 429 });
    }

    recordUsage(provider, model, tokensIn, tokensOut, cost);
    recordRouteRequest("/v1/chat/completions", Date.now() - start);
    return Response.json(resolved.data);
  } catch (e: any) {
    logError("ROUTE_ERROR", e);
    recordRouteRequest("/v1/chat/completions", Date.now() - start, true);
    const status = e?.status || 503;
    return Response.json({ error: { message: scrub(e?.message || String(e)), type: "server_error" } }, { status });
  }
}
