import { scrub } from "./scrubber";
import { threadReqId } from "./reqId";

export type LogEntry = { ts: number; reqId?: string; level: "info" | "warn" | "error"; msg: string; meta?: any };

const entries: LogEntry[] = [];
const MAX = 500;

export function log(level: LogEntry["level"], msg: string, meta?: any) {
  const entry: LogEntry = { ts: Date.now(), reqId: threadReqId(), level, msg, meta: scrubMeta(meta) };
  entries.push(entry);
  if (entries.length > MAX) entries.splice(0, entries.length - MAX);
  const safe = { ...entry, meta: safeStringify(entry.meta) };
  console.log(JSON.stringify(safe));
}

export function logInfo(msg: string, meta?: any) { log("info", msg, meta); }
export function logWarn(msg: string, meta?: any) { log("warn", msg, meta); }
export function logError(msg: string, meta?: any) { log("error", msg, meta); }

export function getRecentLogs(limit = 100) {
  return entries.slice(-limit);
}

function scrubMeta(meta: any): any {
  if (!meta || typeof meta !== "object") return meta;
  if (Array.isArray(meta)) return meta.map(scrubMeta);
  const out: any = {};
  for (const [k, v] of Object.entries(meta)) {
    if (typeof v === "string") out[k] = scrub(v);
    else if (typeof v === "object" && v !== null) out[k] = scrubMeta(v);
    else out[k] = v;
  }
  return out;
}

function safeStringify(v: any) {
  try { return JSON.parse(JSON.stringify(v)); } catch { return "[unserializable]"; }
}
