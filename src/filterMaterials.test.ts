import { describe, expect, it } from "vitest";
import { filterMaterials } from "./filterMaterials";
import { MaterialsType } from "./types";

function row(
  partial: Partial<MaterialsType> & Pick<MaterialsType, "id" | "material">,
): MaterialsType {
  return { price: 0, units: 1, ...partial };
}

const rows = [
  row({ id: "1", material: "screws" }),
  row({ id: "2", material: "white silicone" }),
  row({ id: "3", material: "Emulsion paint" }),
];

describe("filterMaterials", () => {
  it("returns every row when the query is empty", () => {
    expect(filterMaterials(rows, "")).toEqual(rows);
    expect(filterMaterials(rows, "   ")).toEqual(rows);
  });

  it("matches a material name, ignoring case", () => {
    expect(filterMaterials(rows, "silicone").map((item) => item.id)).toEqual([
      "2",
    ]);
    expect(filterMaterials(rows, "EMULSION").map((item) => item.id)).toEqual([
      "3",
    ]);
  });

  it("trims the query", () => {
    expect(filterMaterials(rows, "  screws  ").map((item) => item.id)).toEqual([
      "1",
    ]);
  });

  it("returns nothing when no name matches", () => {
    expect(filterMaterials(rows, "zzzz")).toEqual([]);
  });
});
