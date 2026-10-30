import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import os from "os";
import { encrypt, decrypt, masterKey, ensureDataDir } from "@/lib/vault";
const dir = path.join(os.homedir(), ".3evo");
const file = path.join(dir, "accounts.json.enc");
export interface Account { id: string; provider: string; token: string; expiresAt: number; }
export function loadAccounts(): Account[] {
  ensureDataDir();
  if (!existsSync(file)) return [];
  try { return JSON.parse(decrypt(readFileSync(file, "utf8"), masterKey())); } catch { return []; }
}
export function saveAccounts(accs: Account[]) { ensureDataDir(); writeFileSync(file, encrypt(JSON.stringify(accs), masterKey())); }
export function upsertAccount(acc: Account) {
  const accs = loadAccounts().filter(a => a.id !== acc.id);
  accs.push(acc);
  saveAccounts(accs);
}