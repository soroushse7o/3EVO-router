import { serve } from "@hono/node-server";
import app from "./index";
import healthApp from "./health";

const port = parseInt(process.env.GATEWAY_PORT || "3011");
console.log(`Gateway listening on http://127.0.0.1:${port}`);
serve({ fetch: (req) => {
  const url = new URL(req.url);
  if (url.pathname === "/health" || url.pathname.startsWith("/health")) {
    return healthApp.fetch(req);
  }
  return app.fetch(req);
}, port });
