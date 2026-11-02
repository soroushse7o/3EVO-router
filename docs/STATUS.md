# 3EVO Router — Honest Build/Test Status

Generated November 2, 2026 from a live `npm ci`, `npm run build`, and `npm test`
on the current checked-out tree.

## Install

```
> npm ci
npm ERR! code EPERM
npm ERR! syscall unlink
npm ERR! path C:\Users\Administrator\3evo-router\node_modules\@next\swc-win32-x64-msvc\next-swc.win32-x64-msvc.node
...
npm ERR! The operation was rejected by your operating system.
...
npm WARN using --force Recommended protections disabled.
npm ERR! code EPERM
npm ERR! syscall unlink
...
> npm install
npm warn cleanup Failed to remove some directories [
...
added 64 packages, removed 2 packages, changed 17 packages, and audited 83 packages in 2m
found 0 vulnerabilities
npm warn install-scripts 1 package had install scripts blocked because they are not covered by allowScripts:
npm warn install-scripts better-sqlite3@13.0.3 (install: node-gyp rebuild)
```

## Build

```
> npm run build
▲ Next.js 16.4.3 (Turbopack)
✓ Compiled successfully in 7.3s
✓ Generating static pages (41/41)
```

## Test (project tests only: src/lib/__tests__)

```
> npx vitest run src/lib/__tests__
Test Files  6 passed (6)
     Tests  62 passed (62)
```

## Test (full suite including reference/tests)

```
> npm test
Test Files  267 failed | 153 passed | 4 skipped (424)
     Tests  155 failed | 1777 passed | 114 skipped | 1 todo (2047)
```

Notes:
- The 62 project tests in `src/lib/__tests__` all pass.
- The 424-file suite also picks up `reference/tests/` and `reference/src/` from a
  reference implementation tree. Many of those tests import modules that do not
  exist in this repo (`open-sse/...`, `@/sse/...`, `@/lib/...`), so they are
  not runnable here.
- `better-sqlite3` native build was blocked by the npm allowScripts policy on
  Windows; the dependency is present but may be a prebuilt artifact. Verify with
  a clean Windows container if native performance matters.
