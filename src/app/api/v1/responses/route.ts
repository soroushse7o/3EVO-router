import { NextRequest } from "next/server";
import { runWithFallback, createProxyTier, streamWithFallback } from "@/lib/router";
import { recordUsage } from "@/lib/db";
import { validateApiKey } from "@/lib/api-key";
import { isSafeUrl } from "@/lib/ssrf";
import { logError, scrub } from "@/lib/logger";
import { getSortedAccounts, getAccountById } from "@/lib/accounts";
import { responsesToChat } from "@/lib/translator";
export async function POST(req: NextRequest) {
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  if (!key || !validateApiKey(key)) {
    return Response.json({ error: { message: "invalid api key", type: "auth_error" } }, { status: 401 });
  }
  const body = await req.json();
  const upstreamUrl = process.env.UPSTREAM_URL || "http://127.0.0.1:18434/v1/chat/completions";
  if (!isSafeUrl(upstreamUrl)) {
    return Response.json({ error: { message: "blocked url", type: "invalid_request_error" } }, { status: 400 });
  }
  const apiKey = process.env.LOCAL_MODEL_API_KEY;
  if (!apiKey) {
    return Response.json({ error: { message: "server misconfigured: LOCAL_MODEL_API_KEY is not set", type: "server_error" } }, { status: 500 });
  }
  const accounts = getSortedAccounts();
  const defaultUpstream = process.env.UPSTREAM_URL || "http://127.0.0.1:18434/v1/chat/completions";
  if (!isSafeUrl(defaultUpstream)) {
    return Response.json({ error: { message: "blocked url", type: "invalid_request_error" } }, { status: 400 });
  }

  const chatBody = responsesToChat(body);
  const apiTiers = accounts.map(a => createProxyTier(a.id, chatBody, apiKey));
  const defaultTier = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    req.signal?.addEventListener?.("abort", () => controller.abort());
    const r = await fetch(defaultUpstream, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey }, body: JSON.stringify(chatBody), signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw { status: r.status, message: data.error?.message || data.error || "upstream error", type: data.error?.type || "upstream_error" };
    return { data, provider: "local" };
  };
  const tiers = [...apiTiers, defaultTier];

  try {
    const resolved = await runWithFallback(tiers, "responses:" + (req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"), 30000);
    const text = resolved.data.choices?.[0]?.message?.content || "";
    recordUsage((resolved as any).provider || "local", body.model || "unknown", resolved.data.usage?.prompt_tokens || 0, resolved.data.usage?.completion_tokens || 0, 0);
    return Response.json({ id: "resp_1", object: "response", output: [{ type: "message", content: [{ type: "output_text", text }] }] });
  } catch (e) {
    logError("ROUTE_ERROR", e);
    const err = e as any;
    const status = err?.status || 503;
    return Response.json({ error: { message: scrub(err?.message || String(e)), type: "server_error" } }, { status });
  }
}
