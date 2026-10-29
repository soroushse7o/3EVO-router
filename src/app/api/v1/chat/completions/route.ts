import { NextRequest } from "next/server";
export async function GET() {
  return Response.json({ data: [{ id: "combo/premium-coding", object: "model" }] });
}
export async function POST(req: NextRequest) {
  const body = await req.json();
  return Response.json({ id: "chatcmpl-1", object: "chat.completion", choices: [{ index: 0, message: { role: "assistant", content: "Hello from 3EVO Router" }, finish_reason: "stop" }], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } });
}
