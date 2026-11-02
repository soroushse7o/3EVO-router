import crypto from "node:crypto";

const SECRET = process.env.JWT_SECRET || "change-me-to-a-long-random-secret";

function base64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function verifyDashboardAuthToken(token) {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [headerB64, payloadB64, sigB64] = parts;
    const dataToSign = `${headerB64}.${payloadB64}`;
    const expected = base64url(crypto.createHmac("sha256", SECRET).update(dataToSign).digest());
    if (sigB64 !== expected) return false;
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf8"));
    if (payload.exp && Date.now() > payload.exp * 1000) return false;
    return !!payload?.sub;
  } catch {
    return false;
  }
}

export function createDashboardAuthToken(sub) {
  const header = base64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = base64url(Buffer.from(JSON.stringify({ sub, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 })));
  const dataToSign = `${header}.${payload}`;
  const sig = base64url(crypto.createHmac("sha256", SECRET).update(dataToSign).digest());
  return `${header}.${payload}.${sig}`;
}
