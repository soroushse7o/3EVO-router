import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/api-key";
import { isSafeUrl } from "@/lib/ssrf";
export async function POST(req: NextRequest) {
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  if (!key || !validateApiKey(key)) {
    return Response.json({ error: "invalid api key" }, { status: 401 });
  }
  const body = await req.json();
  const input = typeof body.input === "string" ? body.input : (body.input?.map((i: any) => i.content).join("") || "");
  const upstream = await fetch(process.env.UPSTREAM_URL || "http://127.0.0.1:18434/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + (process.env.LOCAL_MODEL_API_KEY || "_fZvyqDksRI74Ug0BmDsWbYNxuFpRZmR") },
    body: JSON.stringify({ model: body.model || "Qwen2.5-14B-Instruct-Q4_K_M", messages: [{ role: "user", content: input }], max_tokens: body.max_output_tokens || 256 }),
  });
  const data = await upstream.json();
  return Response.json({ id: "resp_1", object: "response", output: [{ type: "message", content: [{ type: "output_text", text: data.choices?.[0]?.message?.content || "" }] }] });
}
