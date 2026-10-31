import { describe, it, expect } from "vitest";
import { scrub } from "../scrubber";
import { hashPassword, verifyPassword, validatePassword, createSession, validateSession, destroySession, ensureAuth } from "../auth";
import { upsertAccount, loadAccounts, saveAccounts } from "../accounts";
describe("P1 security", () => {
  it("scrub removes Bearer token", () => {
    const out = scrub("Authorization: Bearer abc123");
    expect(out).not.toContain("abc123");
    expect(out).toContain("[REDACTED_SECRET]");
  });
  it("password hashing with scrypt", () => {
    const pw = "testpass";
    const { hash, salt } = hashPassword(pw);
    expect(hash).toBeTruthy();
    expect(salt).toBeTruthy();
    expect(verifyPassword(pw, salt, hash)).toBe(true);
    expect(verifyPassword("wrong", salt, hash)).toBe(false);
  });
  it("session validation", () => {
    ensureAuth();
    const session = createSession();
    expect(validateSession(session)).toBe(true);
    expect(validateSession("invalid")).toBe(false);
    destroySession(session);
    expect(validateSession(session)).toBe(false);
  });
  it("S2: upsertAccount does not overwrite existing accounts", () => {
    saveAccounts([
      { id: "a1", provider: "p1", token: "t1", expiresAt: Date.now() + 1000 },
      { id: "a2", provider: "p2", token: "t2", expiresAt: Date.now() + 1000 },
    ]);
    upsertAccount({ id: "a3", provider: "p3", token: "t3", expiresAt: Date.now() + 1000 });
    const all = loadAccounts();
    expect(all.map(a => a.id).sort()).toEqual(["a1", "a2", "a3"]);
  });
});
