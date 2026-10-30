import { NextRequest } from "next/server";
import { runWithFallback } from "@/lib/router";
import { validateSession } from "@/lib/auth";
export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const tiers = [
    async () => {
      const r = await fetch("http://127.0.0.1:18434/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + (process.env.LOCAL_MODEL_API_KEY || "_fZvyqDksRI74Ug0BmDsWbYNxuFpRZmR") }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error("tier1 failed");
      return { tier: 1, data: await r.json() };
    },
    async () => {
      const r = await fetch("http://127.0.0.1:18434/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + (process.env.LOCAL_MODEL_API_KEY || "_fZvyqDksRI74Ug0BmDsWbYNxuFpRZmR") }, body: JSON.stringify(body) });
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
