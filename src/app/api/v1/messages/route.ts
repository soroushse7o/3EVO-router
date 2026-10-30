import { NextRequest } from "next/server";
import { recordUsage } from "@/lib/db";
import { requireApiKey } from "@/lib/api-key";
export async function POST(req: NextRequest) {
  requireApiKey(req);
  const body = await req.json();
  const messages = (body.messages || []).map((m: any) => ({ role: m.role, content: typeof m.content === "string" ? m.content : (m.content?.map((c: any) => c.text || c).join("") || "") }));
  const upstream = await fetch("http://127.0.0.1:18435/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: body.model || "Qwen2.5-14B-Instruct-Q4_K_M", messages, max_tokens: body.max_tokens || 256 }),
  });
  const data = await upstream.json();
  const text = data.choices?.[0]?.message?.content || "";
  const usage = { input_tokens: data.usage?.prompt_tokens || 0, output_tokens: data.usage?.completion_tokens || 0 };
  recordUsage(body.model || "unknown", "messages", usage.input_tokens, usage.output_tokens, 0);
  return Response.json({ id: "msg_1", type: "message", role: "assistant", content: [{ type: "text", text }], model: body.model, stop_reason: "end_turn", usage });
}
export async function GET(req: NextRequest) {
  requireApiKey(req);
  return Response.json({ ok: true });
}
