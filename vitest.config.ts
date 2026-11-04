import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { 
    environment: "node",
    testTimeout: 120000,
    exclude: ["tests/e2e/**", "node_modules/**", "reference/**", "playwright-tests/**", ".next/**", "dist/**"],
  },
  resolve: { alias: { "@": "/src" } }
});
