import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import os from "os";
import { getCrypto } from "./auth";
import { checkRateLimit } from "@/lib/rate-limit";
const dir = path.join(os.homedir(), ".3evo");
const file = path.join(dir, "api-keys.json");
const validatedCache = new Map<string, boolean>();
export function loadApiKeys(): { keyHash: string; salt: string; createdAt: number }[] {
  if (!existsSync(file)) return [];
  try { return JSON.parse(readFileSync(file, "utf8")); } catch { return []; }
}
export function saveApiKeys(keys: { keyHash: string; salt: string; createdAt: number }[]) {
  writeFileSync(file, JSON.stringify(keys, null, 2));
}
export function createApiKey(): string {
  const crypto = getCrypto();
  const salt = crypto.randomBytes(16).toString("hex");
  const key = "3evo-" + crypto.randomBytes(24).toString("hex");
  const hash = crypto.scryptSync(key, Buffer.from(salt, "hex"), 64).toString("hex");
  const keys = loadApiKeys();
  keys.push({ keyHash: hash, salt, createdAt: Date.now() });
  saveApiKeys(keys);
  return key;
}
export function validateApiKey(key: string | undefined): boolean {
  if (!key) return false;
  const cacheKey = getCrypto().createHash("sha256").update(key).digest("hex").slice(0, 16);
  if (validatedCache.has(cacheKey)) return validatedCache.get(cacheKey)!;
  const keys = loadApiKeys();
  const crypto = getCrypto();
  for (const k of keys) {
    const hash = crypto.scryptSync(key, Buffer.from(k.salt, "hex"), 64).toString("hex");
    if (crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(k.keyHash, "hex"))) {
      validatedCache.set(cacheKey, true);
      return true;
    }
  }
  validatedCache.set(cacheKey, false);
  return false;
}
export function requireApiKey(req: any) {
  const key = req.headers?.get?.("authorization")?.replace("Bearer ", "") || req.headers?.get?.("x-api-key");
  if (!key || !validateApiKey(key)) {
    throw new Response(JSON.stringify({ error: "invalid api key" }), { status: 401, headers: { "content-type": "application/json" } });
  }
  return { key };
}
