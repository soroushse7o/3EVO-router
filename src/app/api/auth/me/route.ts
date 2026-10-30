import { NextRequest } from "next/server";
export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return Response.json({ authenticated: false }, { status: 401 });
  return Response.json({ authenticated: true });
}
