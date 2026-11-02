import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import { runWithFallback } from "@/lib/router";

describe("E2E fallback with mock upstream", () => {
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      if (req.url === "/fail") {
        res.writeHead(503);
        res.end("upstream error");
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ choices: [{ message: { content: "ok" } }] }));
      }
    });
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        port = typeof addr === "object" && addr ? addr.port : 0;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("falls back to second tier on 503", async () => {
    const result = await runWithFallback([
      async () => { throw { status: 503 }; },
      async () => ({ data: "fallback-ok", provider: "mock" }),
    ], "e2e-fallback");
    expect(result.data).toBe("fallback-ok");
  });

  it("throws after exhausting all tiers", async () => {
    try {
      await runWithFallback([
        async () => { throw { status: 503 }; },
        async () => { throw { status: 503 }; },
      ], "e2e-exhaust");
      expect(false).toBe(true);
    } catch (e: any) {
      expect(e.tried).toBeDefined();
      expect(e.status).toBe(503);
    }
  });
});
