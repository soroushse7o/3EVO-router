import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import os from "os";
import { randomBytes } from "crypto";

const dir = path.join(os.homedir(), ".3evo");
const file = path.join(dir, "api-keys.json");

if (!existsSync(file)) {
  const key = "3evo-" + randomBytes(24).toString("hex");
  const hash = randomBytes(32).toString("hex");
  writeFileSync(file, JSON.stringify([{ keyHash: hash, createdAt: Date.now() }], null, 2));
  console.log("Generated API key:", key);
} else {
  console.log("api-keys.json already exists");
}
