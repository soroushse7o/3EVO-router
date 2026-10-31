import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import os from "os";
import { encrypt, decrypt, masterKey, ensureDataDir } from "@/lib/vault";
const dir = path.join(os.homedir(), ".3evo");
const file = path.join(dir, "accounts.json.enc");
export interface Account { id: string; provider: string; token: string; expiresAt: number; priority?: number; upstreamUrl?: string; }
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
export function getSortedAccounts(provider?: string): Account[] {
  const now = Date.now();
  return loadAccounts()
    .filter(a => !provider || a.provider === provider)
    .filter(a => a.expiresAt > now)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
}
export function getAccountById(id: string): Account | undefined {
  return loadAccounts().find(a => a.id === id);
}