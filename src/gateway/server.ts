import { serve } from "@hono/node-server";
import app from "./index";

const port = parseInt(process.env.GATEWAY_PORT || "3011");
console.log(`Gateway listening on http://127.0.0.1:${port}`);
serve({ fetch: app.fetch, port });
