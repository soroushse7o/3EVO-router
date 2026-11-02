import Database from "better-sqlite3";
import path from "path";
import { DATA_DIR } from "@/lib/paths";
import fs from "fs";

const dir = DATA_DIR;
fs.mkdirSync(dir, { recursive: true });
const db = new Database(path.join(dir, "data.db"));
db.exec(`CREATE TABLE IF NOT EXISTS usage (id INTEGER PRIMARY KEY, ts INTEGER, provider TEXT, model TEXT, tokens_in INTEGER, tokens_out INTEGER, rtk_saved INTEGER)`);
db.exec(`CREATE TABLE IF NOT EXISTS quota (provider TEXT, model TEXT, limit_in INTEGER, limit_out INTEGER, PRIMARY KEY(provider, model))`);

export function recordUsage(provider: string, model: string, tin: number, tout: number, saved: number) {
  db.prepare("INSERT INTO usage (ts,provider,model,tokens_in,tokens_out,rtk_saved) VALUES (?,?,?,?,?,?)").run(Date.now(), provider, model, tin, tout, saved);
}

export function getUsage() {
  return db.prepare("SELECT * FROM usage ORDER BY ts DESC LIMIT 100").all();
}

export function setQuota(provider: string, model: string, limitIn: number, limitOut: number) {
  db.prepare("INSERT OR REPLACE INTO quota (provider, model, limit_in, limit_out) VALUES (?,?,?,?)").run(provider, model, limitIn, limitOut);
}

export function getQuota() {
  return db.prepare("SELECT * FROM quota").all();
}

export function getUsageAggregates() {
  return db.prepare("SELECT provider, model, sum(tokens_in) as tokens_in, sum(tokens_out) as tokens_out, count(*) as requests FROM usage GROUP BY provider, model").all();
}

export function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  if (model.startsWith("gpt-4") || model.includes("claude")) {
    return ((tokensIn + tokensOut) / 1_000_000) * 3;
  }
  return ((tokensIn + tokensOut) / 1_000_000) * 1;
}
