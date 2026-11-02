import { getDataDir } from "@/lib/auth";
import { createHash } from "node:crypto";

const CLI_TOKEN_HEADER = "x-3r-cli-token";
const CLI_TOKEN_SALT = "3r-cli-auth";

let cachedCliToken: string | null = null;

export function getCliToken() {
  if (!cachedCliToken) {
    const secretFile = `${getDataDir()}/machine-id`;
    let secret = "";
    try {
      secret = require("node:fs").readFileSync(secretFile, "utf8").trim();
    } catch {
      secret = createHash("sha256").update(`${process.env.HOSTNAME || "3evo"}${Date.now()}`).digest("hex");
      try { require("node:fs").writeFileSync(secretFile, secret, { mode: 0o600 }); } catch {}
    }
    cachedCliToken = createHash("sha256").update(`${secret}${CLI_TOKEN_SALT}`).digest("hex").slice(0, 32);
  }
  return cachedCliToken;
}

export function hasValidCliToken(request: Request) {
  const token = request.headers.get(CLI_TOKEN_HEADER);
  if (!token) return false;
  return token === getCliToken();
}
