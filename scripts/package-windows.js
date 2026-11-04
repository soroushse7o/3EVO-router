#!/usr/bin/env node
/**
 * Package 3EVO Router for Windows using pkg
 * Creates a single executable binary
 */

import { spawn } from "child_process";
import path from "path";
import os from "os";
import fs from "fs";

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const PKG_JSON = path.join(ROOT, "package.json");

const config = {
  name: "3evo-router",
  target: "node22-win-x64",
  output: path.join(DIST, "3evo-router.exe"),
  assets: [
    path.join(ROOT, ".next", "server", "**", "*"),
    path.join(ROOT, ".next", "static", "**", "*"),
    path.join(ROOT, "public", "**", "*"),
  ],
};

async function build() {
  console.log("Building 3EVO Router for Windows...");

  // Ensure dist directory exists
  if (!fs.existsSync(DIST)) {
    fs.mkdirSync(DIST, { recursive: true });
  }

  // Run next build first
  await runCommand("npm", ["run", "build"], ROOT);

  // Package with pkg
  const pkgArgs = [
    PKG_JSON,
    "--target", config.target,
    "--output", config.output,
  ];

  if (config.assets.length > 0) {
    config.assets.forEach(asset => {
      pkgArgs.push("--asset");
      pkgArgs.push(asset);
    });
  }

  await runCommand("npx", ["pkg", ...pkgArgs], ROOT);

  console.log(`\nBuild complete: ${config.output}`);
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { cwd, stdio: "inherit" });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
