import { describe, expect, it } from "vitest";
import { moveMaterial } from "./moveMaterial";
import { MaterialsType } from "./types";

function row(
  partial: Partial<MaterialsType> & Pick<MaterialsType, "id" | "material">,
): MaterialsType {
  return { price: 0, units: 1, ...partial };
}

const materials = [
  row({ id: "a", material: "screws" }),
  row({ id: "b", material: "blade" }),
  row({ id: "c", material: "lock" }),
];

describe("moveMaterial", () => {
  it("moves a row up", () => {
    expect(moveMaterial(materials, "c", -1).map((m) => m.id)).toEqual([
      "a",
      "c",
      "b",
    ]);
  });

  it("moves a row down", () => {
    expect(moveMaterial(materials, "a", 1).map((m) => m.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("returns the same array at the list bounds", () => {
    expect(moveMaterial(materials, "a", -1)).toBe(materials);
    expect(moveMaterial(materials, "c", 1)).toBe(materials);
  });

  it("returns the same array for a zero offset or unknown id", () => {
    expect(moveMaterial(materials, "a", 0)).toBe(materials);
    expect(moveMaterial(materials, "missing", 1)).toBe(materials);
  });
});
