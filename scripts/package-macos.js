#!/usr/bin/env node
/**
 * Package 3EVO Router for macOS using pkg
 * Creates a single executable binary
 */

import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const PKG_JSON = path.join(ROOT, "package.json");

const config = {
  name: "3evo-router",
  target: "node22-macos-x64",
  output: path.join(DIST, "3evo-router-macos"),
  assets: [
    path.join(ROOT, ".next", "server", "**", "*"),
    path.join(ROOT, ".next", "static", "**", "*"),
    path.join(ROOT, "public", "**", "*"),
  ],
};

async function build() {
  console.log("Building 3EVO Router for macOS...");

  if (!fs.existsSync(DIST)) {
    fs.mkdirSync(DIST, { recursive: true });
  }

  await runCommand("npm", ["run", "build"], ROOT);

  const pkgArgs = [
    PKG_JSON,
    "--target", config.target,
    "--output", config.output,
  ];

  config.assets.forEach(asset => {
    pkgArgs.push("--asset");
    pkgArgs.push(asset);
  });

  await runCommand("npx", ["pkg", ...pkgArgs], ROOT);

  console.log(`\nBuild complete: ${config.output}`);
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { cwd, stdio: "inherit" });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
