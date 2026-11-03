import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { getRequestDetails, getRequestDetail } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!session || !(await validateSession(session))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) return Response.json(await getRequestDetail(id));
  const limit = Number(url.searchParams.get("limit") || "50");
  return Response.json(await getRequestDetails(limit));
}
