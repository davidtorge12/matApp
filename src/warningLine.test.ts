import { describe, expect, it } from "vitest";
import { isWarningLine } from "./warningLine";

describe("isWarningLine", () => {
  it("detects check in the text", () => {
    expect(isWarningLine("worktop / check")).toBe(true);
  });

  it("detects the warning emoji", () => {
    expect(isWarningLine("gutter check❗️")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isWarningLine("CHECK size")).toBe(true);
  });

  it("returns false for a normal name", () => {
    expect(isWarningLine("cam lock")).toBe(false);
  });
});
