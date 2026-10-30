import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path === "/login" || path.startsWith("/_next") || path === "/favicon.ico") return NextResponse.next();
  if (path.startsWith("/v1/")) {
    const key = req.headers.get("authorization")?.replace("Bearer ", "") || req.headers.get("x-api-key");
    if (!key) return NextResponse.json({ error: "missing api key" }, { status: 401 });
    return NextResponse.next();
  }
  if (path.startsWith("/api/")) {
    const session = req.cookies.get("session")?.value;
    if (!validateSession(session)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    return NextResponse.next();
  }
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next|favicon.ico).*)"] };
