import { defineConfig, devices } from "@playwright/test";
import os from "node:os";
import path from "node:path";

// E2E runs against the production build with an isolated data dir and a known admin password.
const dataDir = path.join(os.tmpdir(), "3evo-e2e-data");
const PORT = 20128;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      // Uses the locally installed Chrome; drop `channel` after `npx playwright install chromium`.
      use: { ...devices["Desktop Chrome"], channel: process.env.PW_CHANNEL ?? "chrome" },
    },
  ],
  webServer: {
    command: "npm run start",
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: !!process.env.PW_REUSE_SERVER,
    timeout: 120_000,
    env: { DATA_DIR: dataDir, ADMIN_PASSWORD: "E2eTestPass123", PORT: String(PORT) },
  },
});
