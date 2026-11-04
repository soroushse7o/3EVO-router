import { NextRequest } from "next/server";
import { buildProviderTiers, runWithFallback } from "@/lib/router";
import { recordUsage, saveRequestDetail } from "@/lib/db";
import { validateApiKey } from "@/lib/api-key";
import { logError } from "@/lib/logger";
import { scrub } from "@/lib/scrubber";
import { checkRateLimit } from "@/lib/rateLimit";
import { anthropicToOpenAI } from "@/lib/translator";
import { checkBudget } from "@/lib/budget";
import { estimateCost } from "@/lib/cost";
import { recordRouteRequest, recordProviderRequest } from "@/lib/instrumentation";

export async function POST(req: NextRequest) {
  const start = Date.now();
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const apiKeyPrefix = key ? key.slice(0, 8) : "";
  const route = "/v1/messages";
  const body = await req.json().catch(() => ({} as any));

  async function saveDetail(status: number, provider = "unknown", model = body.model || "unknown", error?: string, responseBody?: any, responseHeaders?: any) {
    try {
      const scrubbedHeaders: Record<string, string> = {};
      for (const [k, v] of req.headers.entries()) {
        if (k.toLowerCase() === "authorization" || k.toLowerCase() === "cookie" || k.toLowerCase() === "x-api-key") {
          scrubbedHeaders[k] = "[REDACTED]";
        } else {
          scrubbedHeaders[k] = v;
        }
      }
      const bodyStr = JSON.stringify(body);
      const scrubbedBodyStr = scrub(bodyStr);
      const scrubbedResponseBody = typeof responseBody === "string" ? scrub(responseBody) : (responseBody ? scrub(JSON.stringify(responseBody)) : undefined);
      await saveRequestDetail({
        id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ts: Date.now(),
        route,
        provider,
        model,
        ip,
        apiKeyPrefix,
        status,
        latencyMs: Date.now() - start,
        requestHeaders: scrubbedHeaders,
        requestBody: JSON.parse(scrubbedBodyStr),
        responseHeaders: responseHeaders || {},
        responseBody: scrubbedResponseBody ? JSON.parse(scrubbedResponseBody) : {},
        error,
      });
    } catch (e) {
      // best-effort; never block response on audit logging
    }
  }

  if (!key || !(await validateApiKey(key))) {
    recordRouteRequest(route, Date.now() - start, true);
    await saveDetail(401, "unknown", "unknown", "invalid api key");
    return Response.json({ error: { message: "invalid api key", type: "auth_error" } }, { status: 401 });
  }
  if (!checkRateLimit(key)) {
    recordRouteRequest(route, Date.now() - start, true);
    await saveDetail(429, "unknown", "unknown", "rate limit exceeded");
    return Response.json({ error: { message: "rate limit exceeded", type: "rate_limit_error" } }, { status: 429 });
  }

  const { nonStream, stream: streamTiers } = await buildProviderTiers(body, req.signal);

  if (!nonStream.length && !streamTiers.length) {
    recordRouteRequest(route, Date.now() - start, true);
    await saveDetail(503, "unknown", body.model || "unknown", "no providers configured");
    return Response.json({ error: { message: "no providers configured", type: "server_error" } }, { status: 503 });
  }

  if (body.stream) {
    try {
      const result = await (await import("@/lib/router")).streamWithFallback(streamTiers, `messages:${ip}`);
      const readable = result.stream;
      recordRouteRequest(route, Date.now() - start);
      recordProviderRequest(result.provider, Date.now() - start);
      await saveDetail(200, result.provider, body.model || "unknown", undefined, undefined, { "content-type": "text/event-stream", "cache-control": "no-cache" });
      return new Response(readable, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
    } catch (e: any) {
      logError("STREAM_ERROR", scrub(e?.message || String(e)));
      recordRouteRequest(route, Date.now() - start, true);
      const status = e?.status || 503;
      await saveDetail(status, "unknown", body.model || "unknown", scrub(e?.message || String(e)));
      return Response.json({ error: { message: scrub(e?.message || String(e)), type: "server_error" } }, { status });
    }
  }

  try {
    const resolved = await runWithFallback<any>(nonStream, `messages:${ip}`);
    const provider = resolved.provider || "unknown";
    const model = body.model || "unknown";
    const tokensIn = resolved.data?.usage?.prompt_tokens || 0;
    const tokensOut = resolved.data?.usage?.completion_tokens || 0;
    const cost = estimateCost(model, tokensIn, tokensOut, provider);

    const budget = await checkBudget(provider, model, tokensIn, tokensOut);
    if (budget.exceeded) {
      recordRouteRequest(route, Date.now() - start, true);
      await saveDetail(429, provider, model, `monthly budget exceeded (remaining: $${budget.remaining?.toFixed(2)})`);
      return Response.json({ error: { message: `monthly budget exceeded (remaining: $${budget.remaining?.toFixed(2)})`, type: "budget_exceeded" } }, { status: 429 });
    }

    recordUsage(provider, model, tokensIn, tokensOut, cost);
    recordRouteRequest(route, Date.now() - start);
    recordProviderRequest(provider, Date.now() - start);
    const data = anthropicToOpenAI(resolved.data || resolved);
    await saveDetail(200, provider, model, undefined, data);
    return Response.json(data, { status: 200 });
  } catch (e: any) {
    logError("CHAT_ERROR", scrub(e?.message || String(e)));
    recordRouteRequest(route, Date.now() - start, true);
    const status = e?.status || 503;
    await saveDetail(status, "unknown", body.model || "unknown", scrub(e?.message || String(e)));
    return Response.json({ error: { message: scrub(e?.message || String(e)), type: "server_error" } }, { status });
  }
}
