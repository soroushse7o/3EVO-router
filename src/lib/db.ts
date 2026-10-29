import Database from "better-sqlite3";
import path from "path";
import os from "os";
import fs from "fs";
const dir = path.join(os.homedir(), ".3evo");
fs.mkdirSync(dir, { recursive: true });
const db = new Database(path.join(dir, "data.db"));
db.exec(`CREATE TABLE IF NOT EXISTS usage (id INTEGER PRIMARY KEY, ts INTEGER, provider TEXT, model TEXT, tokens_in INTEGER, tokens_out INTEGER, rtk_saved INTEGER)`);
export default db;
export function recordUsage(provider: string, model: string, tin: number, tout: number, saved: number) {
  db.prepare("INSERT INTO usage (ts,provider,model,tokens_in,tokens_out,rtk_saved) VALUES (?,?,?,?,?,?)").run(Date.now(), provider, model, tin, tout, saved);
}
export function getUsage() {
  return db.prepare("SELECT * FROM usage ORDER BY ts DESC LIMIT 100").all();
}
