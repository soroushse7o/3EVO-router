import os from "node:os";
import path from "node:path";

function expandHome(p: string): string {
  if (p.startsWith("~")) {
    return path.join(os.homedir(), p.slice(1));
  }
  return p;
}

export const DATA_DIR = expandHome(process.env.DATA_DIR || "~/.3evo");
