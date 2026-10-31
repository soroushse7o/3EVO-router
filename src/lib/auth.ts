export function getCrypto() { return require("crypto"); }
const path = require("path");
export function getDataDir() { return process.env.DATA_DIR || path.join(process.env.HOME || process.env.USERPROFILE || ".", ".3evo"); }
const LOCKOUT_FILE = () => path.join(getDataDir(), "lockout.json");
function readLockout() { return readJson(LOCKOUT_FILE(), { attempts: 0, until: 0 }); }
function writeLockout(data: any) { writeJson(LOCKOUT_FILE(), data); }
export function recordFailedAuth(ip: string): { locked: boolean; until: number; attempts: number } {
  const data = readLockout();
  const now = Date.now();
  if (data.until > now) return { locked: true, until: data.until, attempts: data.attempts || 0 };
  data.attempts = (data.attempts || 0) + 1;
  if (data.attempts >= 3) {
    data.until = now + Math.pow(2, data.attempts - 3) * 1000;
  }
  writeLockout(data);
  return { locked: data.until > now, until: data.until, attempts: data.attempts };
}
export function checkLockout() {
  const data = readLockout();
  return { locked: data.until > Date.now(), until: data.until, attempts: data.attempts || 0 };
}
export function clearLockout() { writeLockout({ attempts: 0, until: 0 }); }
function readJson(file: string, fallback: any) { const fs = require("fs"); if (!fs.existsSync(file)) return fallback; try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } }
function writeJson(file: string, data: any) { const fs = require("fs"); const tmp = file + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(data, null, 2)); fs.renameSync(tmp, file); }
export function hashPassword(password: string) { const crypto = getCrypto(); const salt = crypto.randomBytes(16); const hash = crypto.scryptSync(password, salt, 64); return { salt: salt.toString("hex"), hash: hash.toString("hex") }; }
export function verifyPassword(password: string, saltHex: string, hashHex: string) { const crypto = getCrypto(); const hash = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), 64); return crypto.timingSafeEqual(hash, Buffer.from(hashHex, "hex")); }
export function ensureAuth() { const fs = require("fs"); const path = require("path"); const crypto = getCrypto(); const DATA_DIR = getDataDir(); fs.mkdirSync(DATA_DIR, { recursive: true }); const AUTH_FILE = path.join(DATA_DIR, "auth.json"); if (!fs.existsSync(AUTH_FILE)) {    const pw = process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString("hex"); const { hash, salt } = hashPassword(pw); fs.writeFileSync(AUTH_FILE, JSON.stringify({ passwordHash: hash, salt }, null, 2)); try { fs.chmodSync(AUTH_FILE, 0o600); fs.chmodSync(DATA_DIR, 0o700); } catch {} } }
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
