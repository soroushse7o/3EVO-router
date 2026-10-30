import { describe, it, expect } from "vitest";
import { scrub } from "../scrubber";
describe("scrubber", () => {
  it("redacts secrets", () => {
    expect(scrub("Authorization: Bearer abc123")).toContain("[REDACTED_SECRET]");
    expect(scrub("sk-1234567890abcdef")).toContain("[REDACTED_SECRET]");
  });
});
