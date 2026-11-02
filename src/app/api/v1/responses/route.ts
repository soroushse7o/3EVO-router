import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/api-key";

export async function POST(req: NextRequest) {
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  if (!key || !validateApiKey(key)) {
    return Response.json({ error: { message: "invalid api key", type: "auth_error" } }, { status: 401 });
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

  // Delegate to chat completions with translated body
  const chatBody = {
    model: body.model || "gpt-4o-mini",
    messages,
    stream: body.stream || false,
    max_tokens: body.max_output_tokens || 1024,
    temperature: body.temperature,
  };

  const res = await fetch("http://localhost:20128/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(chatBody),
    signal: req.signal,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "upstream error");
    return Response.json({ error: { message: err, type: "server_error" } }, { status: res.status });
  }

  if (body.stream) {
    return new Response(res.body, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  }

  const data = await res.json();
  // Translate Chat Completions -> Responses API format
  const choice = data.choices?.[0];
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
      input_tokens: data.usage?.prompt_tokens || 0,
      output_tokens: data.usage?.completion_tokens || 0,
      total_tokens: data.usage?.total_tokens || 0,
    },
    model: data.model || body.model,
  };
  return Response.json(response);
}
