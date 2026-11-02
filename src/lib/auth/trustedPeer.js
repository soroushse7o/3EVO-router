export function hasTrustedPeerHeaders(request) {
  return !!(request.headers.get("x-9r-real-ip") && request.headers.get("x-9r-peer-token"));
}
