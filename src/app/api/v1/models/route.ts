export async function GET() {
  return Response.json({ data: [{ id: "premium-coding", object: "model" }], object: "list" });
}
