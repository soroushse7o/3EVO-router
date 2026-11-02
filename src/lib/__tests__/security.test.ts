import { describe, it, expect, beforeEach } from "vitest";
import { scrub } from "../scrubber";
import { hashPassword, verifyPassword, validatePassword, ensureAuth, createSession, validateSession, destroySession, checkLockout, recordFailedAuth, clearLockout } from "../auth";

describe("P1 security", () => {
  beforeEach(() => { ensureAuth(); });

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

  it("session validation", async () => {
    const session = await createSession();
    expect(await validateSession(session)).toBe(true);
    expect(await validateSession("invalid")).toBe(false);
    expect(await validateSession("")).toBe(false);
  });

  it("validateApiKey creates and validates", async () => {
    const { createApiKey, validateApiKey } = await import("../api-key");
    const key = createApiKey("test");
    expect(validateApiKey(key)).toBe(true);
    expect(validateApiKey("fake-key-123")).toBe(false);
    expect(validateApiKey(undefined)).toBe(false);
  });

  it("progressive lockout after failed attempts", async () => {
    clearLockout("test-ip");
    expect(checkLockout("test-ip").locked).toBe(false);
    const a1 = recordFailedAuth("test-ip");
    expect(a1.locked).toBe(false);
    expect(a1.attempts).toBe(1);
    const a2 = recordFailedAuth("test-ip");
    expect(a2.locked).toBe(false);
    expect(a2.attempts).toBe(2);
    const a3 = recordFailedAuth("test-ip");
    expect(a3.locked).toBe(true);
    expect(a3.attempts).toBe(3);
    clearLockout("test-ip");
  });

  it("vault encrypt/decrypt roundtrip", async () => {
    const { encrypt, decrypt, masterKey } = await import("../vault");
    const plain = "test-token-123";
    const enc = encrypt(plain, masterKey());
    const dec = decrypt(enc, masterKey());
    expect(dec).toBe(plain);
  });
});
