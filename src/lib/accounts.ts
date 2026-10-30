import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import os from "os";
const dir = path.join(os.homedir(), ".3evo");
mkdirSync(dir, { recursive: true });
const file = path.join(dir, "accounts.json");
export interface Account { id: string; provider: string; token: string; expiresAt: number; }
export function loadAccounts(): Account[] { if (!existsSync(file)) return []; return JSON.parse(readFileSync(file, "utf8")); }
export function saveAccounts(accs: Account[]) { writeFileSync(file, JSON.stringify(accs, null, 2)); }
export function upsertAccount(acc: Account) {
  const accs = loadAccounts().filter(a => a.id !== acc.id);
  accs.push(acc);
  saveAccounts(accs);
}