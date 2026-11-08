import { defineConfig } from "vitest/config";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

// Isolate tests from the user's real ~/.3evo data (DB, lockouts, passwords).
const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "3evo-test-"));

export default defineConfig({
  test: { 
    environment: "node",
    testTimeout: 120000,
    env: { DATA_DIR: testDataDir },
    exclude: ["tests/e2e/**", "node_modules/**", "reference/**", "playwright-tests/**", ".next/**", "dist/**"],
  },
  resolve: { alias: { "@": "/src" } }
});
