import { describe, it, expect } from "vitest";
import { scrub } from "../scrubber";
import { hashPassword, verifyPassword, validatePassword, createSession, validateSession, destroySession, ensureAuth } from "../auth";
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
});
