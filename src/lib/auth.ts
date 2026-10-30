import crypto from "crypto";
import fs from "fs";
import path from "path";
import { ensureDataDir } from "@/lib/vault";
const DATA_DIR = process.env.DATA_DIR || path.join(process.env.HOME || process.env.USERPROFILE || ".", ".3evo");
const AUTH_FILE = path.join(DATA_DIR, "auth.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
function readJson(file: string, fallback: any) { if (!fs.existsSync(file)) return fallback; try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } }
function writeJson(file: string, data: any) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }
export function hashPassword(password: string) { const salt = crypto.randomBytes(16); const hash = crypto.scryptSync(password, salt, 64); return { salt: salt.toString("hex"), hash: hash.toString("hex") }; }
export function verifyPassword(password: string, saltHex: string, hashHex: string) { const hash = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), 64); return crypto.timingSafeEqual(hash, Buffer.from(hashHex, "hex")); }
export function ensureAuth() {
  ensureDataDir();
  const auth = readJson(AUTH_FILE, null);
  if (!auth) { const admin = hashPassword("admin"); writeJson(AUTH_FILE, { passwordHash: admin.hash, salt: admin.salt }); }
}
export function validatePassword(password: string) { const auth = readJson(AUTH_FILE, null); if (!auth) return false; return verifyPassword(password, auth.salt, auth.passwordHash); }
export function createSession() { const session = crypto.randomBytes(32).toString("hex"); const sessions = readJson(SESSIONS_FILE, {}); sessions[session] = { created: Date.now() }; writeJson(SESSIONS_FILE, sessions); return session; }
export function validateSession(session: string | undefined) { if (!session) return false; const sessions = readJson(SESSIONS_FILE, {}); return !!sessions[session]; }
export function destroySession(session: string | undefined) { if (!session) return; const sessions = readJson(SESSIONS_FILE, {}); delete sessions[session]; writeJson(SESSIONS_FILE, sessions); }
