import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");

console.log("Preparing 3EVO Router .deb package...\n");

try {
  const VERSION = "1.0.0";
  const PACKAGE_NAME = "3evo-router";
  const BUILD_DIR = path.join(ROOT, ".build-deb");
  const PACKAGE_DIR = path.join(BUILD_DIR, `${PACKAGE_NAME}_${VERSION}_amd64`);
  const CONTROL_DIR = path.join(PACKAGE_DIR, "DEBIAN");
  const USR_DIR = path.join(PACKAGE_DIR, "usr", "local", "lib", PACKAGE_NAME);
  const BIN_DIR = path.join(PACKAGE_DIR, "usr", "local", "bin");

  fs.mkdirSync(CONTROL_DIR, { recursive: true });
  fs.mkdirSync(USR_DIR, { recursive: true });
  fs.mkdirSync(BIN_DIR, { recursive: true });

  // Create control file
  const controlContent = `Package: ${PACKAGE_NAME}
Version: ${VERSION}
Section: web
Priority: optional
Architecture: amd64
Maintainer: 3EVO <support@3evo.dev>
Description: 3EVO Router - Local-first AI Gateway
 A self-hosted AI gateway with failover, rate limiting, and observability.
Homepage: https://github.com/soroushse7o/3EVO-router
Depends: nodejs (>= 18)
`;
  fs.writeFileSync(path.join(CONTROL_DIR, "control"), controlContent);

  // Create postinst script
  const postinst = path.join(CONTROL_DIR, "postinst");
  fs.writeFileSync(postinst, "#!/bin/bash\nexit 0\n");
  fs.chmodSync(postinst, 0o755);

  // Create bin wrapper
  const binWrapper = path.join(BIN_DIR, PACKAGE_NAME);
  fs.writeFileSync(
    binWrapper,
    "#!/bin/bash\nexec /usr/local/lib/3evo-router/server.js \"$@\"\n"
  );
  fs.chmodSync(binWrapper, 0o755);

  // Create tarball of source for Linux build
  const tarball = path.join(DIST, `${PACKAGE_NAME}-${VERSION}.tar.gz`);
  try {
    execSync(`git archive --prefix=${PACKAGE_NAME}-${VERSION}/ HEAD | gzip > ${tarball}`, { cwd: ROOT, stdio: "inherit" });
    console.log(`✓ Source tarball created: ${tarball}`);
  } catch (gitError) {
    console.log("⚠ Git archive failed, using cp -r instead");
    execSync(`tar -czf ${tarball} --exclude=node_modules --exclude=.next --exclude=dist .`, { cwd: ROOT, stdio: "inherit" });
    console.log(`✓ Source tarball created: ${tarball}`);
  }

  console.log(`\n✓ .deb package structure ready at: ${PACKAGE_DIR}`);
  console.log(`  To build on Linux:`);
  console.log(`    1. Extract ${PACKAGE_NAME}-${VERSION}.tar.gz`);
  console.log(`    2. cd ${PACKAGE_NAME}-${VERSION}`);
  console.log(`    3. npm install && npm run build`);
  console.log(`    4. dpkg-deb --build .build-deb/${PACKAGE_NAME}_${VERSION}_amd64`);
} catch (error) {
  console.error("Failed to prepare .deb package:", error.message);
  process.exit(1);
}
