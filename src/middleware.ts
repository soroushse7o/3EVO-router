import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
export function middleware(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const path = req.nextUrl.pathname;
  if (path.startsWith("/api") || path.startsWith("/_next") || path === "/login") return NextResponse.next();
  if (!token) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next|favicon.ico).*)"] };
