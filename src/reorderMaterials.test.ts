import { describe, expect, it } from "vitest";
import { reorderMaterials } from "./reorderMaterials";
import { MaterialsType } from "./types";

function row(
  partial: Partial<MaterialsType> & Pick<MaterialsType, "id" | "material">,
): MaterialsType {
  return { price: 0, units: 1, ...partial };
}

describe("reorderMaterials", () => {
  it("moves the active row to the over row’s index", () => {
    const materials = [
      row({ id: "a", material: "screws" }),
      row({ id: "b", material: "blade" }),
      row({ id: "c", material: "lock" }),
    ];

    expect(reorderMaterials(materials, "c", "a").map((m) => m.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  it("returns the same array when active and over are the same", () => {
    const materials = [
      row({ id: "a", material: "screws" }),
      row({ id: "b", material: "blade" }),
    ];

    expect(reorderMaterials(materials, "a", "a")).toBe(materials);
  });

  it("returns the same array when an id is missing", () => {
    const materials = [row({ id: "a", material: "screws" })];

    expect(reorderMaterials(materials, "a", "missing")).toBe(materials);
    expect(reorderMaterials(materials, "missing", "a")).toBe(materials);
  });
});
