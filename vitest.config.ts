import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { 
    environment: "node",
    testTimeout: 30000,
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
  resolve: { alias: { "@": "/src" } }
});
