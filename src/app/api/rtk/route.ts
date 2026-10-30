import { NextRequest } from "next/server";
import { rtkCompress } from "@/lib/rtk";
export async function POST(req: NextRequest) {
  const { text } = await req.json();
  const before = text.length;
  const afterText = rtkCompress(text);
  return Response.json({ before, after: afterText.length, compressed: afterText });
}
