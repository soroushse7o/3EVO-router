import { verifyDashboardAuthToken } from "./auth/dashboardSession.js";

const PUBLIC_API_PATHS = new Set([
  "/api/health",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/status",
  "/api/version",
]);

const PUBLIC_LLM_PREFIXES = ["/v1", "/v1beta", "/responses"];
const ALWAYS_PROTECTED = ["/api/shutdown"];

export function isPublicApi(pathname) {
  if (PUBLIC_API_PATHS.has(pathname)) return true;
  return PUBLIC_LLM_PREFIXES.some(p => pathname === p || pathname.startsWith(`${p}/`));
}

export function isPublicLlmApi(pathname) {
  return PUBLIC_LLM_PREFIXES.some(p => pathname === p || pathname.startsWith(`${p}/`));
}

export async function canAccessPublicLlmApi(request) {
  // Local requests bypass API key check (matches 9Router behavior)
  if (isLocalRequest(request)) return true;
  // CLI token check
  if (await hasValidCliToken(request)) return true;
  // API key check
  return await hasValidApiKey(request);
}

export async function canAccessLocalOnlyRoute(request) {
  if (await hasValidCliToken(request)) return true;
  if (isLocalRequest(request) && await isAuthenticated(request)) return true;
  return false;
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (isLocalOnlyPath(pathname)) {
    if (!(await canAccessLocalOnlyRoute(request))) {
      return new Response(JSON.stringify({ error: "Local only" }), { status: 403 });
    }
  }

  if (isPublicLlmApi(pathname)) {
    if (await canAccessPublicLlmApi(request)) return undefined; // next()
    return new Response(JSON.stringify({ error: "API key required" }), { status: 401 });
  }

  if (pathname.startsWith("/api/")) {
    if (isPublicApi(pathname)) return undefined;
    if (await hasValidCliToken(request) || await isAuthenticated(request)) return undefined;
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  if (pathname.startsWith("/dashboard")) {
    if (!(await isAuthenticated(request))) {
      return Response.redirect(new URL("/login", request.url));
    }
  }

  if (pathname === "/") {
    return Response.redirect(new URL("/dashboard", request.url));
  }

  return undefined;
}

function isLocalOnlyPath(pathname) {
  return false; // v0.1 has no local-only routes yet
}

async function isAuthenticated(request) {
  const token = request.cookies.get("auth_token")?.value;
  if (token && await verifyDashboardAuthToken(token)) return true;
  const settings = await import("@/lib/db").then(m => m.getSettings());
  if (settings && settings.requireLogin === false) return true;
  return false;
}

async function hasValidApiKey(request) {
  const apiKey = extractApiKey(request);
  if (!apiKey) return false;
  return await validateApiKey(apiKey);
}

async function hasValidCliToken(request) {
  const token = request.headers.get("x-9r-cli-token");
  if (!token) return false;
  const { getConsistentMachineId } = await import("@/shared/utils/machineId.js");
  return token === await getConsistentMachineId("9r-cli-auth");
}

function extractApiKey(request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return request.headers.get("x-api-key") || request.nextUrl.searchParams?.get("key") || null;
}

function isLocalRequest(request) {
  // In dev mode, trust loopback host
  if (process.env.NODE_ENV === "development") {
    const host = request.headers.get("host") || "";
    return host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("::1");
  }
  // In production, check trusted peer header (set by custom-server.js)
  const realIp = request.headers.get("x-9r-real-ip");
  if (!realIp) return false;
  const ip = realIp.split(",")[0].trim();
  return ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
}
