# 3EVO Router — Decisions

## D001: Baseline test runner
- Context: Need reproducible baseline before refactoring.
- Choice: Run project unit tests under `src/lib/__tests__/` only; exclude `reference/` because it is a read-only design reference with missing deps.
- Why: `reference/` failures are not our defects; they would obscure real project status.

## D002: README honesty pass
- Context: README claimed v1.0.0, 100%, 48/48 tests, Claude Code/Codex support, mid-stream failover, etc.
- Choice: Rewrite README and README.fa.md with accurate Working/Partial/Planned status and file pointers.
- Why: Inflated claims violate safety guardrail #8 and mislead users.

## D003: Admin password
- Context: User requested a fixed default admin password.
- Choice: Hardcode `123456789` as the initial password in the seed script; user can change it in Settings.
- Why: Simpler UX for single-user local gateway; user explicitly requested it.

## D004: Dead features removal
- Context: Many features (OAuth, MITM, RTK, quota, combos, CLI, console, proxy pools, cloud sync) were stubs or simulated.
- Choice: Remove all dead/simulated features; keep only working core.
- Why: Honest core is more maintainable; dead code creates security and UX debt.

## D005: SQLite multi-adapter fallback
- Context: `better-sqlite3` fails to build on Windows due to npm allowScripts policy.
- Choice: Implement multi-adapter chain: `better-sqlite3` → `node:sqlite` → `sql.js` → `bun:sqlite`.
- Why: SQLite must work everywhere; pure-JS `sql.js` is the guaranteed fallback.

## D006: Vault encryption at rest
- Context: Provider API keys must not be stored as plaintext.
- Choice: AES-256-GCM with `master.key` in `$DATA_DIR`; key file mode `0600`.
- Why: Industry-standard encryption; simple file-based key for single-user local deployment.
