import { NextRequest } from "next/server";
export async function GET() {
  return Response.json({
    port: process.env.PORT || "20128",
    baseUrl: process.env.BASE_URL || "http://localhost:20128",
    secretPath: process.env.SECRET_PATH || "",
    dataDir: process.env.DATA_DIR || "~/.3evo",
  });
}
export async function POST(req: NextRequest) {
  const body = await req.json();
  return Response.json({ ok: true, received: body });
}
