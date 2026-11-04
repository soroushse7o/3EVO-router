import path from "node:path";
import fs from "node:fs";
import os from "node:os";

const HOME = os.homedir();

function expandHome(p) {
  if (!p || p === "~") return HOME;
  if (p.startsWith("~/") || p.startsWith("~\\")) return path.join(HOME, p.slice(2));
  return p;
}

const DATA_DIR = expandHome(process.env.DATA_DIR || "~/.3evo");
const DATA_FILE = path.join(DATA_DIR, "data.db");

export function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export { DATA_DIR, DATA_FILE };
