export function getCORSHeaders(origin: string | null): Record<string, string> {
  const allowed = [
    "http://localhost:20128",
    "http://localhost:3000",
    "http://127.0.0.1:20128",
  ];
  if (!origin || allowed.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
      "Access-Control-Allow-Credentials": "true",
    };
  }
  return {};
}
