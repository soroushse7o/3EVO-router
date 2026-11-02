import { NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";
import { validateApiKey } from "@/lib/api-key";
import { hasTrustedPeerHeaders } from "@/lib/auth/trustedPeer";
import { getCliToken, hasValidCliToken } from "@/lib/cliToken";

const PUBLIC_API_PREFIXES = ["/v1", "/v1beta", "/api/v1", "/responses"];
const PUBLIC_PATHS = [
  "/api/health",
  "/api/init",
  "/api/locale",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/status",
  "/api/version",
  "/api/settings/require-login",
];
const ALWAYS_PROTECTED = [
  "/api/shutdown",
  "/api/settings/database",
  "/api/version/shutdown",
  "/api/version/update",
];
const LOCAL_ONLY_PATHS: string[] = [];

export function isPublicLlmApi(pathname: string) {
  return PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function extractApiKey(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  const apiKeyHeader = request.headers.get("x-api-key");
  if (apiKeyHeader) return apiKeyHeader;
  return request.headers.get("x-goog-api-key") || new URL(request.url).searchParams?.get("key") || null;
}

export async function hasValidApiKey(request: Request) {
  const apiKey = extractApiKey(request);
  if (!apiKey) return false;
  return await validateApiKey(apiKey);
}

export async function hasValidSession(request: Request) {
  const token = request.headers.get("cookie")?.match(/session=([^;]+)/)?.[1];
  if (!token) return false;
  return await validateSession(token);
}

export async function canAccessPublicLlmApi(request: Request) {
  if (await hasValidApiKey(request)) return true;
  if (await hasValidSession(request)) return true;
  if (await hasValidCliToken(request)) return true;
  return false;
}

export async function proxy(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Local-only gate
  if (LOCAL_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
    if (!(await hasValidSession(request))) {
      return NextResponse.json({ error: "Local only" }, { status: 403 });
    }
  }

  // Always protected
  if (ALWAYS_PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (!(await hasValidSession(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Public LLM API — requires API key or session or CLI token
  if (isPublicLlmApi(pathname)) {
    if (await canAccessPublicLlmApi(request)) return NextResponse.next();
    return NextResponse.json({ error: "API key required for remote API access" }, { status: 401 });
  }

  // Deny-by-default for /api/*
  if (pathname.startsWith("/api/")) {
    if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();
    if (await hasValidSession(request)) return NextResponse.next();
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Dashboard routes
  if (pathname.startsWith("/dashboard") || pathname === "/") {
    if (await hasValidSession(request)) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
