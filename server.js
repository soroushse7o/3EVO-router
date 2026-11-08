import { spawn } from "node:child_process";

const port = process.env.PORT || "20128";
const hostname = "0.0.0.0";

const child = spawn("npx", ["next", "start", "-H", hostname, "-p", port], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code || 0);
});

child.on("error", (err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
