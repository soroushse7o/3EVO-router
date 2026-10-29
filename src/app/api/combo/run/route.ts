import { NextRequest } from "next/server";
import { runWithFallback } from "@/lib/router";
export async function POST(req: NextRequest) {
  const body = await req.json();
  const tiers = [
    async () => {
      const r = await fetch("http://127.0.0.1:18435/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error("tier1 failed");
      return { tier: 1, data: await r.json() };
    },
    async () => {
      const r = await fetch("http://127.0.0.1:18435/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error("tier2 failed");
      return { tier: 2, data: await r.json() };
    },
  ];
  try {
    const result = await runWithFallback(tiers);
    return Response.json(result);
  } catch (e: any) {
    return Response.json({ error: e.message || "all tiers exhausted" }, { status: 503 });
  }
}
