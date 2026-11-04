import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";
import { getProviderStats, getRouteStats } from "@/lib/instrumentation";

export async function GET(_req: NextRequest) {
  const session = _req.cookies.get("session")?.value;
  if (!session || !(await validateSession(session))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const providerStats = getProviderStats();
  const routeStats = getRouteStats();

  const lines = [
    "# HELP 3evo_requests_total Total requests per provider/route",
    "# TYPE 3evo_requests_total counter",
    ...providerStats.flatMap((p) => [
      `3evo_requests_total{provider="${p.provider}",type="provider"} ${p.requests}`,
    ]),
    ...routeStats.flatMap((r) => [
      `3evo_requests_total{route="${r.route}",type="route"} ${r.requests}`,
    ]),
    "",
    "# HELP 3evo_errors_total Total errors per provider/route",
    "# TYPE 3evo_errors_total counter",
    ...providerStats.flatMap((p) => [
      `3evo_errors_total{provider="${p.provider}"} ${p.errors}`,
    ]),
    ...routeStats.flatMap((r) => [
      `3evo_errors_total{route="${r.route}"} ${r.errors}`,
    ]),
    "",
    "# HELP 3evo_request_duration_ms Average request duration in ms",
    "# TYPE 3evo_request_duration_ms gauge",
    ...providerStats.flatMap((p) => [
      `3evo_request_duration_ms{provider="${p.provider}"} ${p.avgMs}`,
    ]),
    ...routeStats.flatMap((r) => [
      `3evo_request_duration_ms{route="${r.route}"} ${r.avgMs}`,
    ]),
    "",
    "# HELP 3evo_error_rate Error rate (0-1)",
    "# TYPE 3evo_error_rate gauge",
    ...providerStats.flatMap((p) => [
      `3evo_error_rate{provider="${p.provider}"} ${p.errorRate.toFixed(4)}`,
    ]),
    ...routeStats.flatMap((r) => [
      `3evo_error_rate{route="${r.route}"} ${(r.errors / (r.requests || 1)).toFixed(4)}`,
    ]),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; version=0.0.4",
    },
  });
}
