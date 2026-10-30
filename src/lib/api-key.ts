import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import os from "os";
import { getCrypto } from "./auth";
const dir = path.join(os.homedir(), ".3evo");
const file = path.join(dir, "api-keys.json");
function getCrypto2() { return require("crypto"); }
export function loadApiKeys(): { keyHash: string; createdAt: number }[] {
  if (!existsSync(file)) return [];
  try { return JSON.parse(readFileSync(file, "utf8")); } catch { return []; }
}
export function saveApiKeys(keys: { keyHash: string; createdAt: number }[]) {
  writeFileSync(file, JSON.stringify(keys, null, 2));
}
export function createApiKey(): string {
  const crypto = getCrypto2();
  const key = "3evo-" + crypto.randomBytes(24).toString("hex");
  const hash = crypto.scryptSync(key, crypto.randomBytes(16), 64).toString("hex");
  const keys = loadApiKeys();
  keys.push({ keyHash: hash, createdAt: Date.now() });
  saveApiKeys(keys);
  return key;
}
export function validateApiKey(key: string | undefined): boolean {
  if (!key) return false;
  const crypto = getCrypto2();
  const keys = loadApiKeys();
  for (const k of keys) {
    const hash = crypto.scryptSync(key, Buffer.from(k.keyHash.slice(0, 32), "hex"), 64).toString("hex");
    if (crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(k.keyHash.slice(0, 128)))) return true;
  }
  return false;
}
export function requireApiKey(req: any) {
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  if (!key || !validateApiKey(key)) {
    const err = new Error("invalid api key") as any;
    err.status = 401;
    throw err;
  }
  return { key };
}
