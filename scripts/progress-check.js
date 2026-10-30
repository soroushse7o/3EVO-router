import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = join(__dirname, "..");
const LAST_STATE_FILE = join(PROJECT, ".last-progress-state.json");

function run(cmd: string): string {
  try { return execSync(cmd, { cwd: PROJECT, encoding: "utf8", stdio: ["pipe","pipe","pipe"] }).trim(); } 
  catch (e: any) { return e.stderr?.toString().trim() || e.message?.toString().trim() || "ERROR"; }
}

function getProgress(): { percent: number; checked: number; total: number } {
  const content = readFileSync(join(PROJECT, "docs/REMAINING.md"), "utf8");
  const checked = (content.match(/^- \[x\]/gm) || []).length;
  const unchecked = (content.match(/^- \[ \]/gm) || []).length;
  const total = checked + unchecked;
  return { percent: total === 0 ? 0 : Math.round((checked / total) * 100), checked, total };
}

function getRecentCommits(n = 5): string[] {
  return run(`git log --oneline -${n}`).split("\n").filter(Boolean);
}

function getUncommitted(): string {
  const stat = run("git status --porcelain");
  return stat || "(none)";
}

function getLastState(): any {
  try { return JSON.parse(readFileSync(LAST_STATE_FILE, "utf8")); } catch { return null; }
}

function saveState(state: any) {
  writeFileSync(LAST_STATE_FILE, JSON.stringify(state, null, 2));
}

function main() {
  const progress = getProgress();
  const commits = getRecentCommits();
  const uncommitted = getUncommitted();
  const last = getLastState();
  
  const hasChanges = !last || 
    last.percent !== progress.percent || 
    last.commits.join("\n") !== commits.join("\n") ||
    uncommitted !== "(none)";
  
  const state = { percent: progress.percent, commits, uncommitted, ts: Date.now() };
  saveState(state);
  
  if (!hasChanges) {
    console.log(`[${new Date().toISOString()}] No changes. Progress: ${progress.percent}%`);
    return;
  }
  
  let report = `\n${"=".repeat(50)}\n`;
  report += `🔍 بازرس پروژه — ${new Date().toISOString().slice(0,19).replace("T"," ")}\n`;
  report += `${"=".repeat(50)}\n\n`;
  report += `📊 پیشرفت: ${progress.percent}% (${progress.checked}/${progress.total} آیتم)\n\n`;
  
  if (commits.length) {
    report += `📝 آخرین کامیت‌ها:\n`;
    commits.forEach((c, i) => report += `  ${i+1}. ${c}\n`);
    report += "\n";
  }
  
  if (uncommitted !== "(none)") {
    report += `⚠️  تغییرات uncommitted:\n${uncommitted.split("\n").map(l => "  "+l).join("\n")}\n\n`;
    try {
      run("git add -A");
      run('git commit -m "auto: progress sync ' + new Date().toISOString().slice(0,19).replace("T","_") + '"');
      run("git push origin main");
      report += `✅ تغییرات auto-commit + push شد.\n\n`;
    } catch (e) {
      report += `❌ خطا در git push: ${e}\n\n`;
    }
  }
  
  report += `${"=".repeat(50)}\n`;
  console.log(report);
}

main();
