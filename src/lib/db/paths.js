import path from "node:path";
import fs from "node:fs";

const DATA_DIR = process.env.DATA_DIR || path.join(process.env.USERPROFILE || process.env.HOME || "~", ".3evo");
const DATA_FILE = path.join(DATA_DIR, "data.db");

export function expandHome(p) {
  if (!p || p === "~") return DATA_DIR;
  if (p.startsWith("~/") || p.startsWith("~\\")) return path.join(DATA_DIR, p.slice(2));
  return p;
}

export function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export { DATA_DIR, DATA_FILE };
