import { getAdapter } from "../driver.js";

export async function getAuthRecord() {
  const db = await getAdapter();
  const row = db.get(`SELECT * FROM auth WHERE id = 1`);
  return row || null;
}

export async function upsertAuthRecord(passwordHash, salt) {
  const db = await getAdapter();
  db.run(`INSERT INTO auth(id, password_hash, salt) VALUES(1, ?, ?) ON CONFLICT(id) DO UPDATE SET password_hash = excluded.password_hash, salt = excluded.salt`, [passwordHash, salt]);
}

export async function createSessionRecord(session, created, expires) {
  const db = await getAdapter();
  db.run("INSERT OR REPLACE INTO sessions(session, created, expires) VALUES(?, ?, ?)", [session, created, expires]);
}

export async function deleteSession(session) {
  const db = await getAdapter();
  db.run("DELETE FROM sessions WHERE session = ?", [session]);
}

export async function getLockout(ip) {
  const db = await getAdapter();
  const row = db.get("SELECT * FROM lockout WHERE ip = ?", [ip]);
  return row || null;
}

export async function setLockout(ip, attempts, until) {
  const db = await getAdapter();
  db.run("INSERT INTO lockout(ip, attempts, until) VALUES(?, ?, ?) ON CONFLICT(ip) DO UPDATE SET attempts = excluded.attempts, until = excluded.until", [ip, attempts, until]);
}

export async function clearLockout(ip) {
  const db = await getAdapter();
  db.run("DELETE FROM lockout WHERE ip = ?", [ip]);
}
