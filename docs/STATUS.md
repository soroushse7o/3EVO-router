# 3EVO Router — Honest Build/Test Status

Generated November 2, 2026 from live runs on the current checked-out tree.

## Install

```
> npm install
added 64 packages, removed 2 packages, changed 17 packages, and audited 83 packages in 2m
found 0 vulnerabilities
npm warn install-scripts better-sqlite3@13.0.3 (install: node-gyp rebuild)
```

## Build

```
> npm run build
▲ Next.js 16.4.3 (Turbopack)
✓ Compiled successfully
✓ Running TypeScript
✓ Generating static pages (21/21)
```

## Test (project tests only: src/lib/__tests__)

```
> npx vitest run src/lib/__tests__
Test Files  6 passed (6)
     Tests  58 passed (58)
```

## CI / Docker

- `.github/workflows/ci.yml` added: install, build, vitest on Node LTS.
- `Dockerfile` added: non-root user, `DATA_DIR` volume, port `20128`.

## Notes

- `better-sqlite3` native build was blocked by the npm allowScripts policy on
  Windows; `sql.js` is used as pure-JS fallback.
- The full `npm test` suite also picks up `reference/tests/` and `reference/src/`
  from a reference implementation tree. Many of those tests import modules that
  do not exist in this repo, so they are not runnable here and are excluded from
  project CI.
