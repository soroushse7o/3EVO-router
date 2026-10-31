import { Hono } from "hono";
import { cors } from "hono/cors";
import { runWithFallback } from "../lib/router";
import { validateApiKey } from "../lib/api-key";

const app = new Hono();
const corsOrigins = process.env.CORS_ORIGINS?.split(",").map(o => o.trim()).filter(Boolean) || [];
if (corsOrigins.length > 0) {
  app.use("*", cors({ origin: (origin) => corsOrigins.includes(origin) ? origin : corsOrigins[0], allowHeaders: ["Content-Type", "Authorization"] }));
}

app.get("/v1/models", (c) => {
  return c.json({ object: "list", data: [{ id: "qwen2.5-coder-7b-instruct-q8_0", object: "model", owned_by: "local" }] });
});

app.post("/v1/chat/completions", async (c) => {
  const key = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!validateApiKey(key)) return c.json({ error: "invalid api key" }, 401);
  
  const body = await c.req.json();
  const tier = () => fetch("http://127.0.0.1:18434/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.LOCAL_MODEL_API_KEY || ""}` },
    body: JSON.stringify(body),
  }).then(r => r.json());
  
  const result = await runWithFallback([tier]);
  if (body.stream) {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("data: " + JSON.stringify(result) + "\n\n"));
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  }
  return c.json(result);
});

app.post("/v1/messages", async (c) => {
  const key = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!validateApiKey(key)) return c.json({ error: "invalid api key" }, 401);
  
  const body = await c.req.json();
  const tier = () => fetch("http://127.0.0.1:18434/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.LOCAL_MODEL_API_KEY || ""}` },
    body: JSON.stringify(body),
  }).then(r => r.json());
  
  const result = await runWithFallback([tier]);
  return c.json(result);
});

app.post("/v1/responses", async (c) => {
  const key = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!validateApiKey(key)) return c.json({ error: "invalid api key" }, 401);
  
  const body = await c.req.json();
  const tier = () => fetch("http://127.0.0.1:18434/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.LOCAL_MODEL_API_KEY || ""}` },
    body: JSON.stringify(body),
  }).then(r => r.json());
  
  const result = await runWithFallback([tier]);
  return c.json(result);
});

export default app;
