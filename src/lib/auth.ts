import { DATA_DIR } from "@/lib/paths";
import { getAuthRecord, upsertAuthRecord, createSessionRecord, deleteSession as dbDeleteSession } from "@/lib/db";
import { getLockout, setLockout, clearLockout as dbClearLockout } from "@/lib/db";
import { getDb } from "@/lib/db";

export function getDataDir() { return DATA_DIR; }
export { getDb };

export function hashPassword(password: string) {
  const crypto = require("node:crypto");
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return { salt: salt.toString("hex"), hash: hash.toString("hex") };
}

export function verifyPassword(password: string, saltHex: string, hashHex: string) {
  const crypto = require("node:crypto");
  const hash = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), 64);
  return crypto.timingSafeEqual(hash, Buffer.from(hashHex, "hex"));
}

export async function ensureAuth() {
  const row = await getAuthRecord();
  if (!row?.password_hash) {
    // Use ADMIN_PASSWORD if provided, otherwise generate a random one-time password
    // and record it in <DATA_DIR>/bootstrap.log (never a hardcoded default).
    const crypto = require("node:crypto");
    const fs = require("node:fs");
    const path = require("node:path");
    const initialPassword: string = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString("hex");
    const { hash, salt } = hashPassword(initialPassword);
    await upsertAuthRecord(hash, salt);
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(path.join(DATA_DIR, "bootstrap.log"), `First password: ${initialPassword}\n`, { mode: 0o600 });
    } catch (e) {
      console.error("[AUTH] could not write bootstrap.log", e);
    }
    return initialPassword;
  }
  return null;
}

export async function validatePassword(password: string) {
  const row = await getAuthRecord();
  if (!row?.password_hash) return false;
  return verifyPassword(password, row.salt, row.password_hash);
}

export async function createSession() {
  const { createDashboardAuthToken } = await import("./auth/dashboardSession.js");
  const token = await createDashboardAuthToken("dashboard");
  return token;
}

export async function validateSession(session: string | undefined): Promise<boolean> {
  if (!session) return false;
  const { verifyDashboardAuthToken } = await import("./auth/dashboardSession.js");
  return await verifyDashboardAuthToken(session);
}

export async function destroySession(session: string | undefined) {
  if (!session) return;
  await dbDeleteSession(session);
}

export function requireAuth(req: any) {
  const token = req?.cookies?.get?.("session")?.value;
  if (!token) {
    const err = new Error("unauthorized") as any;
    err.status = 401;
    throw err;
  }
  return { token };
}

export async function checkLockout(ip: string) {
  const row = await getLockout(ip);
  if (!row) return { locked: false, until: 0, attempts: 0 };
  const locked = Date.now() < row.until;
  return { locked, until: row.until || 0, attempts: row.attempts || 0 };
}

export async function recordFailedAuth(ip: string) {
  const row = await getLockout(ip);
  const now = Date.now();
  const until = row && now < row.until ? row.until : 0;
  const attempts = until ? row.attempts : (row?.attempts || 0) + 1;
  const newUntil = attempts >= 3 ? now + Math.pow(2, attempts - 2) * 1000 : 0;
  await setLockout(ip, attempts, newUntil);
  return { locked: newUntil > 0 && now < newUntil, until: newUntil, attempts };
}

export async function clearLockout(ip: string) {
  await dbClearLockout(ip);
}
