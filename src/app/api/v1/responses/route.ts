import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/api-key";
import { buildProviderTiers, runWithFallback } from "@/lib/router";
import { recordUsage } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { checkBudget } from "@/lib/budget";
import { estimateCost } from "@/lib/cost";
import { recordRouteRequest } from "@/lib/instrumentation";
import { logError } from "@/lib/logger";
import { scrub } from "@/lib/scrubber";

export async function POST(req: NextRequest) {
  const start = Date.now();
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  if (!key || !validateApiKey(key)) {
    recordRouteRequest("/v1/responses", Date.now() - start, true);
    return Response.json({ error: { message: "invalid api key", type: "auth_error" } }, { status: 401 });
  }
  if (!checkRateLimit(key)) {
    recordRouteRequest("/v1/responses", Date.now() - start, true);
    return Response.json({ error: { message: "rate limit exceeded", type: "rate_limit_error" } }, { status: 429 });
  }

  const body = await req.json();
  // Translate Responses API -> Chat Completions format internally
  const messages = [];
  if (body.input) {
    if (typeof body.input === "string") {
      messages.push({ role: "user", content: body.input });
    } else if (Array.isArray(body.input)) {
      for (const part of body.input) {
        if (part.type === "message" && part.content) {
          const role = part.role === "assistant" ? "assistant" : "user";
          const text = typeof part.content === "string" ? part.content : part.content?.map((c: any) => c.text || "").join("") || "";
          messages.push({ role, content: text });
        } else if (part.type === "input_text" || part.type === "text") {
          messages.push({ role: "user", content: part.text || part.content || "" });
        }
      }
    }
  }
  if (body.instructions) {
    messages.unshift({ role: "system", content: body.instructions });
  }

  const chatBody = {
    model: body.model || "gpt-4o-mini",
    messages,
    stream: body.stream || false,
    max_tokens: body.max_output_tokens || 1024,
    temperature: body.temperature,
  };

  if (chatBody.stream) {
    // For streaming, proxy through chat completions endpoint
    try {
      const res = await fetch("http://localhost:20128/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify(chatBody),
        signal: req.signal,
      });
      if (!res.ok) {
        const err = await res.text().catch(() => "upstream error");
        recordRouteRequest("/v1/responses", Date.now() - start, true);
        return Response.json({ error: { message: err, type: "server_error" } }, { status: res.status });
      }
      recordRouteRequest("/v1/responses", Date.now() - start);
      return new Response(res.body, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    } catch (e: any) {
      logError("RESPONSES_STREAM_ERROR", e);
      recordRouteRequest("/v1/responses", Date.now() - start, true);
      const status = e?.status || 503;
      return Response.json({ error: { message: scrub(e?.message || String(e)), type: "server_error" } }, { status });
    }
  }

  const { nonStream } = await buildProviderTiers(chatBody, req.signal);
  if (!nonStream.length) {
    recordRouteRequest("/v1/responses", Date.now() - start, true);
    return Response.json({ error: { message: "no providers configured", type: "server_error" } }, { status: 503 });
  }

  try {
    const resolved = await runWithFallback<any>(nonStream, `responses:${req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"}`);
    const provider = resolved.provider || "unknown";
    const model = chatBody.model || "unknown";
    const tokensIn = resolved.data.usage?.prompt_tokens || 0;
    const tokensOut = resolved.data.usage?.completion_tokens || 0;
    const cost = estimateCost(model, tokensIn, tokensOut, provider);

    const budget = await checkBudget(provider, model, tokensIn, tokensOut);
    if (budget.exceeded) {
      recordRouteRequest("/v1/responses", Date.now() - start, true);
      return Response.json({ error: { message: `monthly budget exceeded (remaining: $${budget.remaining?.toFixed(2)})`, type: "budget_exceeded" } }, { status: 429 });
    }

    try {
      recordUsage(provider, model, tokensIn, tokensOut, cost);
    } catch (e) {
      // Best-effort usage tracking
    }

    recordRouteRequest("/v1/responses", Date.now() - start);
    const choice = resolved.data.choices?.[0];
    const response = {
      id: `resp-${Date.now()}`,
      object: "response",
      created_at: Math.floor(Date.now() / 1000),
      status: "completed",
      output: [
        {
          type: "message",
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: [
            {
              type: "output_text",
              text: choice?.message?.content || "",
            },
          ],
        },
      ],
      usage: {
        input_tokens: resolved.data.usage?.prompt_tokens || 0,
        output_tokens: resolved.data.usage?.completion_tokens || 0,
        total_tokens: resolved.data.usage?.total_tokens || 0,
      },
      model: resolved.data.model || chatBody.model,
    };
    return Response.json(response);
  } catch (e: any) {
    logError("RESPONSES_ERROR", e);
    recordRouteRequest("/v1/responses", Date.now() - start, true);
    const status = e?.status || 503;
    return Response.json({ error: { message: scrub(e?.message || String(e)), type: "server_error" } }, { status });
  }
}
