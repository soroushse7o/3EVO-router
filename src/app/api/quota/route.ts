import { NextRequest } from "next/server";
export async function GET() {
  return Response.json({ window: "5h", used: 0, limit: 100, resetIn: 0 });
}
export async function POST(req: NextRequest) {
  const body = await req.json();
  return Response.json({ ok: true, received: body });
}
