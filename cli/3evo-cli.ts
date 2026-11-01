#!/usr/bin/env node
import { spawn } from "child_process";
import http from "http";
import fs from "fs";
import path from "path";

const DATA = path.join(process.env.HOME || process.env.USERPROFILE || "", ".3evo");

function usage() {
  console.log("3EVO Router CLI");
  console.log("  status      - show server status");
  console.log("  usage       - show recent usage");
  console.log("  providers   - list custom providers");
  console.log("  serve       - start local server (dev)");
}

function getUsage() {
  const db = path.join(DATA, "data.db");
  if (!fs.existsSync(db)) { console.log("No usage data yet."); return; }
  const sql = `SELECT provider, model, sum(tokens_in) as tin, sum(tokens_out) as tout, count(*) as reqs FROM usage GROUP BY provider, model`;
  // minimal reader
  const rows = require("better-sqlite3")(db).prepare(sql).all();
  console.table(rows);
}

function getProviders() {
  const f = path.join(DATA, "custom-providers.json");
  if (!fs.existsSync(f)) { console.log("No custom providers."); return; }
  console.log(fs.readFileSync(f, "utf8"));
}

async function checkStatus() {
  try {
    const r = await fetch("http://127.0.0.1:20128/health");
    console.log("Server:", r.ok ? "running" : "degraded");
  } catch { console.log("Server: not running"); }
}

const cmd = process.argv[2] || "help";
if (cmd === "help") usage();
else if (cmd === "status") checkStatus();
else if (cmd === "usage") getUsage();
else if (cmd === "providers") getProviders();
else if (cmd === "serve") {
  console.log("Starting dev server via next dev ...");
  const child = spawn("npx", ["next", "dev"], { stdio: "inherit" });
  process.on("SIGINT", () => child.kill("SIGINT"));
} else {
  console.log("Unknown command:", cmd);
  usage();
  process.exit(1);
}
