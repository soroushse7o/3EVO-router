export function hasTrustedPeerHeaders(request: Request): boolean {
  const token = process.env.NINEROUTER_PEER_TOKEN;
  return Boolean(token) && request.headers.get("x-9r-peer-token") === token;
}
