import { describe, it, expect } from "vitest";
import { rtkCompress } from "../rtk";
describe("rtk", () => {
  it("collapses repeated lines", () => { expect(rtkCompress("a\na\na")).toContain("×3"); });
  it("strips ANSI", () => { expect(rtkCompress("\x1b[31mred\x1b[0m")).not.toContain("\x1b"); });
});
