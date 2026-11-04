import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");

console.log("Building 3EVO Router Windows installer...\n");

try {
  // Build the app
  console.log("Building Next.js app...");
  execSync("npm run build", { cwd: ROOT, stdio: "inherit" });

  // Create installer directory
  const installerDir = path.join(DIST, "windows-installer");
  fs.mkdirSync(installerDir, { recursive: true });

  // Create NSIS script
  const nsisScript = path.join(installerDir, "3evo-router.nsi");
  const installerPath = path.join(DIST, "3evo-router-setup.exe");
  const standaloneDir = path.join(ROOT, ".next", "standalone");
  const publicDir = path.join(ROOT, "public");

  const standaloneEscaped = standaloneDir.replace(/\\/g, "\\\\");
  const publicEscaped = publicDir.replace(/\\/g, "\\\\");
  const installerEscaped = installerPath.replace(/\\/g, "\\\\");

  const script = `!include "MUI2.nsh"
Name "3EVO Router"
OutFile "${installerEscaped}"
InstallDir "$PROGRAMFILES\\\\3EVO Router"
Page directory
Page instfiles

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "${standaloneEscaped}\\*"
  File /r "${publicEscaped}\\*"
  
  CreateShortCut "$SMPROGRAMS\\\\3EVO Router.lnk" "$INSTDIR\\\\server.js"
  CreateShortCut "$DESKTOP\\\\3EVO Router.lnk" "$INSTDIR\\\\server.js"
  
  WriteUninstaller "$INSTDIR\\\\uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$SMPROGRAMS\\\\3EVO Router.lnk"
  Delete "$DESKTOP\\\\3EVO Router.lnk"
  RMDir /r "$INSTDIR"
SectionEnd
`;

  fs.writeFileSync(nsisScript, script);

  console.log(`✓ Windows installer script created: ${nsisScript}`);
  console.log(`  Build with: makensis ${nsisScript}`);
  console.log(`  Output: ${installerPath}`);
} catch (error) {
  console.error("Failed to build Windows installer:", error.message);
  process.exit(1);
}
