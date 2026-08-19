import { describe, expect, it } from "vitest";
import {
  applyMaterialSuggestion,
  applySuggestionToLastLine,
  catalogueNames,
  suggestMaterials,
} from "./suggestMaterials";

const names = ["blade", "screws", "white silicone", "White emulsion"];

describe("catalogueNames", () => {
  it("dedupes case-insensitively and keeps the first spelling", () => {
    expect(
      catalogueNames([
        ["White Silicone", "screws"],
        ["white silicone", "blade"],
      ]),
    ).toEqual(["blade", "screws", "White Silicone"]);
  });

  it("drops blank names", () => {
    expect(catalogueNames([["  ", "screws", ""]])).toEqual(["screws"]);
  });
});

describe("suggestMaterials", () => {
  it("returns nothing until the user has typed a name", () => {
    expect(suggestMaterials("", names)).toEqual([]);
    expect(suggestMaterials("12x ", names)).toEqual([]);
  });

  it("prefers names that start with the typed text", () => {
    expect(suggestMaterials("wh", names)).toEqual([
      "white silicone",
      "White emulsion",
    ]);
  });

  it("strips a quantity prefix before matching", () => {
    expect(suggestMaterials("2x sil", names)).toEqual(["white silicone"]);
  });

  it("matches a substring when nothing starts with the query", () => {
    expect(suggestMaterials("silic", names)).toEqual(["white silicone"]);
  });

  it("omits an exact match so the list does not repeat the typed name", () => {
    expect(suggestMaterials("screws", names)).toEqual([]);
  });

  it("caps the list", () => {
    const many = Array.from({ length: 20 }, (_, i) => `screw ${i}`);
    expect(suggestMaterials("screw", many, 5)).toHaveLength(5);
  });
});

describe("applyMaterialSuggestion", () => {
  it("replaces a bare name", () => {
    expect(applyMaterialSuggestion("sil", "white silicone")).toBe("white silicone");
  });

  it("keeps a quantity prefix", () => {
    expect(applyMaterialSuggestion("2x sil", "white silicone")).toBe(
      "2x white silicone",
    );
  });
});

describe("applySuggestionToLastLine", () => {
  it("replaces only the last line of a materials list", () => {
    expect(applySuggestionToLastLine("1x blade\n2x sil", "white silicone")).toBe(
      "1x blade\n2x white silicone",
    );
  });

  it("fills an empty field", () => {
    expect(applySuggestionToLastLine("", "screws")).toBe("screws");
  });
});
