import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import { generateRootCert, hasRootCert, getCertPaths } from "@/lib/mitm-certs";

export async function GET(req: NextRequest) {
  if (process.env.EXPERIMENTAL_MITM !== "1") return Response.json({ error: "experimental feature disabled" }, { status: 403 });
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json({ hasCert: hasRootCert(), paths: getCertPaths() });
}

export async function POST(req: NextRequest) {
  if (process.env.EXPERIMENTAL_MITM !== "1") return Response.json({ error: "experimental feature disabled" }, { status: 403 });
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const paths = generateRootCert();
  return Response.json({ ok: true, paths });
}
