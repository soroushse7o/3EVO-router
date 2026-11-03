import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasTrustedPeerHeaders } from "@/lib/auth/trustedPeer";

const PUBLIC_API_PREFIXES = ["/v1", "/v1beta", "/api/v1", "/responses"];
const PUBLIC_PATHS = ["/api/health", "/api/init", "/api/locale", "/api/auth/login", "/api/auth/logout", "/api/auth/status", "/api/version", "/api/settings/require-login"];

function isPublicLlmApi(pathname: string) {
  return PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isPublicApi(pathname: string) {
  if (isPublicLlmApi(pathname)) return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Trusted peer bypass — only from localhost
  if (hasTrustedPeerHeaders(request)) {
    const origin = request.headers.get("origin") || request.headers.get("referer") || "";
    const isLocal = origin.includes("localhost") || origin.includes("127.0.0.1") || !origin;
    if (isLocal) {
      return NextResponse.next();
    }
  }

  // Public LLM API prefixes — allow through; deeper auth happens in route handlers
  if (isPublicLlmApi(pathname)) {
    return NextResponse.next();
  }

  // Public API paths — allow through
  if (isPublicApi(pathname)) {
    return NextResponse.next();
  }

  // Dashboard routes — redirect to login if no session
  if (pathname.startsWith("/dashboard") || pathname === "/") {
    const session = request.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Deny-by-default for /api/* without explicit allow-list
  if (pathname.startsWith("/api/")) {
    const session = request.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\.ico).*)"],
};
