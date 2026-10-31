import { Hono } from "hono";
const app = new Hono();
app.get("/health", (c) => c.json({ status: "ok", gateway: "3evo-router" }));
export default app;
