import { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/api-key";
export async function POST(req: NextRequest) {
  requireApiKey(req);
  const body = await req.json();
  const input = typeof body.input === "string" ? body.input : (body.input?.map((i: any) => i.content).join("") || "");
  const upstream = await fetch("http://127.0.0.1:18435/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: body.model || "Qwen2.5-14B-Instruct-Q4_K_M", messages: [{ role: "user", content: input }], max_tokens: body.max_output_tokens || 256 }),
  });
  const data = await upstream.json();
  return Response.json({ id: "resp_1", object: "response", output: [{ type: "message", content: [{ type: "output_text", text: data.choices?.[0]?.message?.content || "" }] }] });
}
