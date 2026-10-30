import { NextRequest } from "next/server";
export async function POST(req: NextRequest) {
  const { provider } = await req.json();
  return Response.json({ provider, authUrl: `https://example.com/oauth/${provider}`, state: "pending" });
}
