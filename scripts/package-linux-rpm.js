import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");

console.log("Preparing 3EVO Router .rpm package...\n");

try {
  const VERSION = "1.0.0";
  const PACKAGE_NAME = "3evo-router";
  const BUILD_DIR = path.join(ROOT, ".build-rpm");
  const SPEC_DIR = path.join(BUILD_DIR, "SPECS");
  const SOURCES_DIR = path.join(BUILD_DIR, "SOURCES");
  const BUILDROOT = path.join(BUILD_DIR, "BUILDROOT");

  fs.mkdirSync(SPEC_DIR, { recursive: true });
  fs.mkdirSync(SOURCES_DIR, { recursive: true });
  fs.mkdirSync(BUILDROOT, { recursive: true });

  // Create tarball of source
  const tarball = `${PACKAGE_NAME}-${VERSION}.tar.gz`;
  const tarballPath = path.join(SOURCES_DIR, tarball);
  try {
    execSync(`git archive --prefix=${PACKAGE_NAME}-${VERSION}/ HEAD | gzip > ${tarballPath}`, { cwd: ROOT, stdio: "inherit" });
  } catch (gitError) {
    execSync(`tar -czf ${tarballPath} --exclude=node_modules --exclude=.next --exclude=dist .`, { cwd: ROOT, stdio: "inherit" });
  }
  console.log(`✓ Source tarball created: ${tarballPath}`);

  // Create RPM spec file
  const specContent = `Name: ${PACKAGE_NAME}
Version: ${VERSION}
Release: 1%{?dist}
Summary: 3EVO Router - Local-first AI Gateway
License: MIT
URL: https://github.com/soroushse7o/3EVO-router
BuildRequires: nodejs >= 18
Requires: nodejs >= 18

%description
A self-hosted AI gateway with failover, rate limiting, and observability.

%prep
%setup -q

%build
npm install
npm run build

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}/usr/local/lib/${PACKAGE_NAME}
mkdir -p %{buildroot}/usr/local/bin
cp -r .next/standalone/* %{buildroot}/usr/local/lib/${PACKAGE_NAME}/
cp -r public %{buildroot}/usr/local/lib/${PACKAGE_NAME}/
cat > %{buildroot}/usr/local/bin/${PACKAGE_NAME} << 'SCRIPT'
#!/bin/bash
exec /usr/local/lib/${PACKAGE_NAME}/server.js "$@"
SCRIPT
chmod +x %{buildroot}/usr/local/bin/${PACKAGE_NAME}

%files
%defattr(-,root,root,-)
/usr/local/lib/${PACKAGE_NAME}
/usr/local/bin/${PACKAGE_NAME}

%changelog
* ${new Date().toISOString().split('T')[0]} 3EVO <support@3evo.dev> - ${VERSION}-1
- Initial package
`;
  fs.writeFileSync(path.join(SPEC_DIR, `${PACKAGE_NAME}.spec`), specContent);

  console.log(`\n✓ .rpm package structure ready at: ${BUILD_DIR}`);
  console.log(`  To build on Linux:`);
  console.log(`    1. Install rpm-build: dnf install rpm-build`);
  console.log(`    2. rpmbuild -ba ${path.join(SPEC_DIR, PACKAGE_NAME + '.spec')}`);
  console.log(`    3. Output in ~/rpmbuild/RPMS/x86_64/`);
} catch (error) {
  console.error("Failed to prepare .rpm package:", error.message);
  process.exit(1);
}
