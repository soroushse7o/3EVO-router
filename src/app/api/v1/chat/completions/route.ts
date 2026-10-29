import { NextRequest } from "next/server";
export async function GET() {
  return Response.json({ data: [{ id: "combo/premium-coding", object: "model" }] });
}
export async function POST(req: NextRequest) {
  const body = await req.json();
  const upstream = await fetch("http://127.0.0.1:18435/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await upstream.json();
  return Response.json(data, { status: upstream.status });
}
