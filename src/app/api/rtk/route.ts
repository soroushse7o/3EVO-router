import { NextRequest } from "next/server";
import { rtkCompress } from "@/lib/rtk";
import { validateSession } from "@/lib/auth";
export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { text } = await req.json();
  const before = text.length;
  const afterText = rtkCompress(text);
  return Response.json({ before, after: afterText.length, compressed: afterText });
}
