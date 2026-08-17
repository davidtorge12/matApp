import { describe, expect, it } from "vitest";
import { aggregateMaterials, parseMaterialLine } from "./parseMaterials";

describe("parseMaterialLine", () => {
  it("returns null for blank lines", () => {
    expect(parseMaterialLine("")).toBeNull();
    expect(parseMaterialLine("   ")).toBeNull();
  });

  it("reads a single-digit quantity", () => {
    expect(parseMaterialLine("1x cam lock")).toEqual({
      units: 1,
      name: "cam lock",
    });
  });

  it("reads two-digit quantities instead of only the first character", () => {
    expect(parseMaterialLine("12x screws")).toEqual({
      units: 12,
      name: "screws",
    });
  });

  it("reads decimal quantities and capital X", () => {
    expect(parseMaterialLine("2.5X plasterboard")).toEqual({
      units: 2.5,
      name: "plasterboard",
    });
  });

  it("treats a line with no quantity as 1 unit", () => {
    expect(parseMaterialLine("scraper")).toEqual({
      units: 1,
      name: "scraper",
    });
  });
});

describe("aggregateMaterials", () => {
  it("sums quantities for the same material name", () => {
    expect(
      aggregateMaterials(["12x screws", "2x screws", "1x blade", "", "12x screws"])
    ).toEqual({
      screws: 26,
      blade: 1,
    });
  });
});
