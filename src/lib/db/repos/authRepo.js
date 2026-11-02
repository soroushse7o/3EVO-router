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
