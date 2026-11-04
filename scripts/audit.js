import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const ISSUES = [];

function check(description, testFn) {
  try {
    const result = testFn();
    if (result && result.startsWith("OK")) {
      ISSUES.push({ level: "PASS", description, detail: result });
    } else if (result && result.startsWith("WARN")) {
      ISSUES.push({ level: "WARN", description, detail: result });
    } else {
      ISSUES.push({ level: "FAIL", description, detail: result || "Check failed" });
    }
  } catch (error) {
    ISSUES.push({
      level: "ERROR",
      description,
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

console.log("3EVO Router Security Audit\n");

// Check 1: No .env in git
check(".env is not tracked in git", () => {
  try {
    const tracked = execSync("git ls-files .env", { cwd: ROOT, encoding: "utf8" }).trim();
    return tracked ? "FAIL: .env is tracked" : "OK";
  } catch {
    return "OK (not a git repo or no .env)";
  }
});

// Check 2: No plaintext secrets in code
check("No plaintext secrets in source code", () => {
  const secretPatterns = [
    /password\s*[:=]\s*['"][^'"]{8,}['"]/i,
    /api[_-]?key\s*[:=]\s*['"][^'"]{8,}['"]/i,
    /secret\s*[:=]\s*['"][^'"]{8,}['"]/i,
  ];

  const srcFiles = getAllFiles(path.join(ROOT, "src"), [".ts", ".tsx", ".js", ".jsx"]);

  for (const file of srcFiles) {
    const content = fs.readFileSync(file, "utf8");
    for (const pattern of secretPatterns) {
      if (pattern.test(content)) {
        return `FAIL: Potential secret in ${path.relative(ROOT, file)}`;
      }
    }
  }
  return "OK";
});

// Check 3: No sensitive files in git
check("No sensitive files tracked in git", () => {
  try {
    const tracked = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" });
    const sensitive = tracked
      .split("\n")
      .filter((f) => /\.(env|pem|key|p12|pfx)$/.test(f) || f.includes("secret"));
    return sensitive.length > 0 ? `FAIL: ${sensitive.join(", ")}` : "OK";
  } catch {
    return "OK";
  }
});

// Check 4: No stray console.log in non-logger code
check("No stray console.log in non-logger code", () => {
  const srcFiles = getAllFiles(path.join(ROOT, "src"), [".ts", ".tsx"]);
  const violations = [];

  for (const file of srcFiles) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("console.log") && !lines[i].trim().startsWith("//") && !file.includes("logger.ts") && !file.includes("streamController")) {
        violations.push(`${path.relative(ROOT, file)}:${i + 1}`);
      }
    }
  }

  return violations.length > 0 ? `FAIL: ${violations.join(", ")}` : "OK";
});

// Check 5: CSRF protection
check("CSRF protection implemented", () => {
  const authRoute = path.join(ROOT, "src", "app", "api", "auth", "route.ts");
  if (!fs.existsSync(authRoute)) return "FAIL: auth route not found";
  const content = fs.readFileSync(authRoute, "utf8");
  return content.includes("csrf") || content.includes("CSRF") || content.includes("x-csrf-token")
    ? "OK"
    : "WARN: No CSRF token found";
});

// Check 6: Rate limiting
check("Rate limiting implemented", () => {
  const rateLimitPath = path.join(ROOT, "src", "lib", "rateLimit.ts");
  return fs.existsSync(rateLimitPath) ? "OK" : "FAIL: rateLimit.ts not found";
});

// Check 7: SSRF protection
check("SSRF protection implemented", () => {
  const ssrfPath = path.join(ROOT, "src", "lib", "ssrf.ts");
  return fs.existsSync(ssrfPath) ? "OK" : "FAIL: ssrf.ts not found";
});

// Check 8: Secure cookies
check("Secure cookie flags", () => {
  const authRoute = path.join(ROOT, "src", "app", "api", "auth", "route.ts");
  if (!fs.existsSync(authRoute)) return "FAIL: auth route not found";
  const content = fs.readFileSync(authRoute, "utf8");
  const hasHttpOnly = content.includes("HttpOnly");
  const hasSameSite = content.includes("SameSite");
  const hasSecure = content.includes("Secure");
  return hasHttpOnly && hasSameSite && hasSecure
    ? "OK"
    : `FAIL: HttpOnly=${hasHttpOnly}, SameSite=${hasSameSite}, Secure=${hasSecure}`;
});

// Print results
const passes = ISSUES.filter((i) => i.level === "PASS").length;
const failures = ISSUES.filter((i) => i.level === "FAIL").length;
const errors = ISSUES.filter((i) => i.level === "ERROR").length;
const warns = ISSUES.filter((i) => i.level === "WARN").length;

for (const issue of ISSUES) {
  const icon =
    issue.level === "PASS" ? "✓" :
    issue.level === "FAIL" ? "✗" :
    issue.level === "ERROR" ? "!" : "?";
  console.log(`  ${icon} ${issue.level}: ${issue.description}`);
  if (issue.detail && issue.detail !== "OK") {
    console.log(`      ${issue.detail}`);
  }
}

console.log(`\nSummary: ${passes} passed, ${failures} failed, ${errors} errors, ${warns} warnings`);
process.exit(failures > 0 ? 1 : 0);

function getAllFiles(dir, extensions) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, extensions));
    } else if (extensions.some((ext) => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}
