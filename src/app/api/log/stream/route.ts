import { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!validateSession(session)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      controller.enqueue(enc.encode("data: [INFO] service started\n\n"));
      const iv = setInterval(() => controller.enqueue(enc.encode("data: [INFO] heartbeat\n\n")), 5000);
      req.signal.addEventListener("abort", () => { clearInterval(iv); controller.close(); });
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
}
