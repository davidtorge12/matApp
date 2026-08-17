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
      aggregateMaterials(["12x screws", "2x screws", "1x blade", "", "12x screws"]),
    ).toEqual({
      screws: 26,
      blade: 1,
    });
  });

  it("splits semicolon-separated materials on one line", () => {
    expect(
      aggregateMaterials(["1x FD / check; 3x fire hinge; 3x fire strip"]),
    ).toEqual({
      "FD / check": 1,
      "fire hinge": 3,
      "fire strip": 3,
    });
  });

  it("sums case-insensitive duplicates and keeps the first name", () => {
    expect(
      aggregateMaterials([
        "1x white silicone",
        "2x White Silicone",
        "1x White silicone",
      ]),
    ).toEqual({
      "white silicone": 4,
    });
  });

  it("merges the same material across codes after splitting lists", () => {
    expect(
      aggregateMaterials([
        "1x white emulsion ; 1x gloss Dulux Once",
        "2x White Emulsion; 1x gloss Dulux Once",
      ]),
    ).toEqual({
      "white emulsion": 3,
      "gloss Dulux Once": 2,
    });
  });
});
