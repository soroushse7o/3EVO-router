export function hasTrustedPeerHeaders(request: Request): boolean {
  const token = process.env.THREEVO_PEER_TOKEN;
  return Boolean(token) && request.headers.get("x-3r-peer-token") === token;
}
