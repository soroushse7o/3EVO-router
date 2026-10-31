import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/api-key";
import { isSafeUrl } from "@/lib/ssrf";
import { logError, scrub } from "@/lib/logger";
export async function POST(req: NextRequest) {
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  if (!key || !validateApiKey(key)) {
    return Response.json({ error: { message: "invalid api key", type: "auth_error" } }, { status: 401 });
  }
  const body = await req.json();
  const input = typeof body.input === "string" ? body.input : (body.input?.map((i: any) => i.content).join("") || "");
  const apiKey = process.env.LOCAL_MODEL_API_KEY;
  if (!apiKey) {
    return Response.json({ error: { message: "server misconfigured: LOCAL_MODEL_API_KEY is not set", type: "server_error" } }, { status: 500 });
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const upstream = await fetch(process.env.UPSTREAM_URL || "http://127.0.0.1:18434/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model: body.model || "Qwen2.5-14B-Instruct-Q4_K_M", messages: [{ role: "user", content: input }], max_tokens: body.max_output_tokens || 256 }),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  if (!upstream.ok) {
    const err = await upstream.text();
    return Response.json({ error: { message: scrub(err.slice(0, 200)), type: "upstream_error" } }, { status: upstream.status });
  }
  const data = await upstream.json();
  return Response.json({ id: "resp_1", object: "response", output: [{ type: "message", content: [{ type: "output_text", text: data.choices?.[0]?.message?.content || "" }] }] });
}
