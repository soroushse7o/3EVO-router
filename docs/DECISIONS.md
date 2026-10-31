# 3EVO Router — Decisions

## D001: Baseline test runner
- Context: Need reproducible baseline before refactoring.
- Choice: Run project unit tests under `src/lib/__tests__/` only; exclude `reference/` because it is a read-only design reference with missing deps.
- Why: `reference/` failures are not our defects; they would obscure real project status.

## D002: README honesty pass
- Context: README claims v1.0.0, 100%, 48/48 tests, Claude Code/Codex support, mid-stream failover, etc.
- Choice: Rewrite README and README.fa.md to Working / Stub / Dead / Not Started per feature, with file pointers and proving test names.
- Why: Inflated claims violate safety guardrail #8 and mislead users.

## D003: Server baseline
- Context: p1-security.test.ts requires live server on 20128.
- Choice: Start dev server in background with ADMIN_PASSWORD set, run tests, capture raw output to `p1-evidence.txt`, then stop server.
- Why: Need real pass/fail evidence, not simulated results.
