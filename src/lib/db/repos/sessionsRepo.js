import { getAdapter } from "../driver.js";

export async function createSessionRecord(session, expires) {
  const db = await getAdapter();
  db.run(`INSERT OR REPLACE INTO sessions(session, created, expires) VALUES(?, ?, ?)`, [session, Date.now(), expires]);
}

export async function getSession(session) {
  const db = await getAdapter();
  const row = db.get(`SELECT * FROM sessions WHERE session = ?`, [session]);
  return row || null;
}

export async function deleteSession(session) {
  const db = await getAdapter();
  db.run(`DELETE FROM sessions WHERE session = ?`, [session]);
}

export async function cleanExpiredSessions() {
  const db = await getAdapter();
  db.run(`DELETE FROM sessions WHERE expires < ?`, [Date.now()]);
}
