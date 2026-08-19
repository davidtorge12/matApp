import { describe, expect, it } from "vitest";
import { serializeVo } from "./serializeVo";

describe("serializeVo", () => {
  it("trims each row and prefixes a missing x marker", () => {
    expect(serializeVo("  renew Bath panel  \n Bonding coat in patch")).toBe(
      "x renew Bath panel\nx Bonding coat in patch",
    );
  });

  it("keeps an existing marker and collapses extra spaces after it", () => {
    expect(serializeVo("x  renew Bath panel")).toBe("x renew Bath panel");
    expect(serializeVo("X   Bonding coat")).toBe("x Bonding coat");
  });

  it("does not add a second marker when the line is already marked", () => {
    expect(serializeVo("x renew Bath panel")).toBe("x renew Bath panel");
  });

  it("leaves blank lines empty after trim", () => {
    expect(serializeVo("a\n  \nb")).toBe("x a\n\nx b");
  });

  it("normalises Windows line endings", () => {
    expect(serializeVo("foo\r\nbar")).toBe("x foo\nx bar");
  });

  it("leaves a matched code prefix in place", () => {
    expect(serializeVo("P1234 x renew Bath panel")).toBe(
      "P1234 x renew Bath panel",
    );
    expect(serializeVo("  P1234  x   renew Bath panel  ")).toBe(
      "P1234 x renew Bath panel",
    );
  });
});
