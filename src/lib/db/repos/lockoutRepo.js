import { getAdapter } from "../driver.js";

export async function getLockout(ip) {
  const db = await getAdapter();
  const row = db.get(`SELECT * FROM lockout WHERE ip = ?`, [ip]);
  return row || null;
}

export async function setLockout(ip, attempts, until) {
  const db = await getAdapter();
  db.run(`INSERT OR REPLACE INTO lockout(ip, attempts, until) VALUES(?, ?, ?)`, [ip, attempts, until]);
}

export async function incrementLockout(ip) {
  const db = await getAdapter();
  const row = await getLockout(ip);
  const attempts = (row?.attempts || 0) + 1;
  const until = attempts >= 5 ? Date.now() + 30_000 : 0;
  await setLockout(ip, attempts, until);
  return { attempts, until };
}

export async function clearLockout(ip) {
  const db = await getAdapter();
  db.run(`DELETE FROM lockout WHERE ip = ?`, [ip]);
}
