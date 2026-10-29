import crypto from "crypto";
import fs from "fs";
import path from "path";
const DATA_DIR = process.env.DATA_DIR || path.join(process.env.HOME || process.env.USERPROFILE || ".", ".3evo");
export function ensureDataDir(){ fs.mkdirSync(DATA_DIR,{recursive:true}); }
export function encrypt(plain:string,key:Buffer){ const iv=crypto.randomBytes(12); const c=crypto.createCipheriv("aes-256-gcm",key,iv); const enc=Buffer.concat([c.update(plain,"utf8"),c.final()]); const tag=c.getAuthTag(); return Buffer.concat([iv,tag,enc]).toString("base64"); }
export function decrypt(b64:string,key:Buffer){ const buf=Buffer.from(b64,"base64"); const iv=buf.subarray(0,12); const tag=buf.subarray(12,28); const enc=buf.subarray(28); const d=crypto.createDecipheriv("aes-256-gcm",key,iv); d.setAuthTag(tag); return Buffer.concat([d.update(enc),d.final()]).toString("utf8"); }
export function masterKey(){ ensureDataDir(); const f=path.join(DATA_DIR,"master.key"); if(!fs.existsSync(f)){ const k=crypto.randomBytes(32); fs.writeFileSync(f,k,{mode:0o600}); return k;} return fs.readFileSync(f); }
