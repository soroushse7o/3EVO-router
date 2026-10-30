export async function GET() {
  return Response.json({ status: "ok", time: Date.now() });
}
