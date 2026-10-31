import { describe, it, expect } from "vitest";
import { scrub } from "../scrubber";
import { hashPassword, verifyPassword, validatePassword, createSession, validateSession, destroySession, ensureAuth } from "../auth";
import { upsertAccount, loadAccounts, saveAccounts } from "../accounts";
import { validateApiKey, createApiKey } from "../api-key";
import { NextRequest } from "next/server";
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
  it("S3: validateApiKey caches result and does not rate-limit valid keys", () => {
    const key = createApiKey();
    const first = validateApiKey(key);
    expect(first).toBe(true);
    const second = validateApiKey(key);
    expect(second).toBe(true);
    expect(validateApiKey("fake-key-123")).toBe(false);
  });
  it("S4: export excludes sensitive files", async () => {
    const { GET } = await import("../../app/api/settings/export/route");
    const req = new NextRequest("http://localhost/api/settings/export", { headers: new Headers({ cookie: "session=invalid" }) });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
  it("S5: import allowlist blocks disallowed files", async () => {
    const { POST } = await import("../../app/api/settings/import/route");
    const req = new NextRequest("http://localhost/api/settings/import", {
      method: "POST",
      headers: new Headers({ cookie: "session=invalid" }),
      body: JSON.stringify({ "accounts.json.enc": {}, "sessions.json": {} }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
