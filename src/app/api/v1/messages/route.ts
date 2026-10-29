import { NextRequest } from "next/server";
export async function POST(req: NextRequest) {
  const body = await req.json();
  // Minimal Anthropic -> OpenAI translation
  const messages = (body.messages || []).map((m: any) => ({ role: m.role, content: typeof m.content === "string" ? m.content : (m.content?.map((c: any) => c.text).join("") || "") }));
  const upstream = await fetch("http://127.0.0.1:18435/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: body.model || "Qwen2.5-14B-Instruct-Q4_K_M", messages, max_tokens: body.max_tokens || 256 }),
  });
  const data = await upstream.json();
  const text = data.choices?.[0]?.message?.content || "";
  return Response.json({ id: "msg_1", type: "message", role: "assistant", content: [{ type: "text", text }], model: body.model, stop_reason: "end_turn", usage: { input_tokens: 0, output_tokens: 0 } });
}
export async function GET() { return Response.json({ ok: true }); }
