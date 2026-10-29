import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
export function middleware(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token && req.nextUrl.pathname.startsWith("/")) {
    // allow login and api
    if (req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/api")) return NextResponse.next();
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next|favicon.ico).*)"] };
