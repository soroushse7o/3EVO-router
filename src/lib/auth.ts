export function getCrypto() { return require("crypto"); }
export function getDataDir() { const path = require("path"); return process.env.DATA_DIR || path.join(process.env.HOME || process.env.USERPROFILE || ".", ".3evo"); }
function readJson(file: string, fallback: any) { const fs = require("fs"); if (!fs.existsSync(file)) return fallback; try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } }
function writeJson(file: string, data: any) { const fs = require("fs"); fs.writeFileSync(file, JSON.stringify(data, null, 2)); }
export function hashPassword(password: string) { const crypto = getCrypto(); const salt = crypto.randomBytes(16); const hash = crypto.scryptSync(password, salt, 64); return { salt: salt.toString("hex"), hash: hash.toString("hex") }; }
export function verifyPassword(password: string, saltHex: string, hashHex: string) { const crypto = getCrypto(); const hash = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), 64); return crypto.timingSafeEqual(hash, Buffer.from(hashHex, "hex")); }
export function ensureAuth() { const fs = require("fs"); const path = require("path"); const DATA_DIR = getDataDir(); fs.mkdirSync(DATA_DIR, { recursive: true }); const AUTH_FILE = path.join(DATA_DIR, "auth.json"); if (!fs.existsSync(AUTH_FILE)) {    const pw = process.env.ADMIN_PASSWORD || getCrypto().randomBytes(16).toString("hex"); const { hash, salt } = hashPassword(pw); writeJson(AUTH_FILE, { passwordHash: hash, salt }); fs.writeFileSync(path.join(DATA_DIR, "bootstrap.log"), "First password: " + pw + "\n"); } }
export function validatePassword(password: string) { const path = require("path"); const auth = readJson(path.join(getDataDir(), "auth.json"), null); if (!auth) return false; return verifyPassword(password, auth.salt, auth.passwordHash); }
export function createSession() { const fs = require("fs"); const path = require("path"); const crypto = getCrypto(); const SESSIONS_FILE = path.join(getDataDir(), "sessions.json"); const session = crypto.randomBytes(32).toString("hex"); const sessions = readJson(SESSIONS_FILE, {}); sessions[session] = { created: Date.now() }; writeJson(SESSIONS_FILE, sessions); return session; }
export function validateSession(session: string | undefined) { const path = require("path"); if (!session) return false; const sessions = readJson(path.join(getDataDir(), "sessions.json"), {}); return !!sessions[session]; }
export function destroySession(session: string | undefined) { if (!session) return; const fs = require("fs"); const path = require("path"); const SESSIONS_FILE = path.join(getDataDir(), "sessions.json"); const sessions = readJson(SESSIONS_FILE, {}); delete sessions[session]; writeJson(SESSIONS_FILE, sessions); }
export function requireAuth(req: any) {
  const session = req?.cookies?.get?.("session")?.value;
  if (!session || !validateSession(session)) {
    const err = new Error("unauthorized") as any;
    err.status = 401;
    throw err;
  }
  return { session };
}
