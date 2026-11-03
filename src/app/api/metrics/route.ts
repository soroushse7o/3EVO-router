import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { getUsage } from "@/lib/db";
import { getProviderStats, getRouteStats } from "@/lib/instrumentation";

export async function GET(_req: NextRequest) {
  const session = _req.cookies.get("session")?.value;
  if (!session || !(await validateSession(session))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows: any[] = await getUsage();
  const totalTokensIn = rows.reduce((s, r) => s + (r.tokens_in || 0), 0);
  const totalTokensOut = rows.reduce((s, r) => s + (r.tokens_out || 0), 0);
  const totalRtk = rows.reduce((s, r) => s + (r.rtk_saved || 0), 0);
  const providers = new Map<string, number>();
  for (const r of rows) providers.set(r.provider || "unknown", (providers.get(r.provider || "unknown") || 0) + 1);

  return Response.json({
    requests: rows.length,
    tokensIn: totalTokensIn,
    tokensOut: totalTokensOut,
    rtkSaved: totalRtk,
    topProviders: Object.fromEntries([...providers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)),
    updatedAt: Date.now(),
    instrumentation: {
      providerStats: getProviderStats(),
      routeStats: getRouteStats(),
    },
  });
}
