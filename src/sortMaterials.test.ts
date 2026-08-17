import { describe, expect, it } from "vitest";
import { nextMaterialSort, sortMaterials } from "./sortMaterials";
import { MaterialsType } from "./types";

function row(
  partial: Partial<MaterialsType> & Pick<MaterialsType, "id" | "material">,
): MaterialsType {
  return { price: 0, units: 1, ...partial };
}

describe("sortMaterials", () => {
  it("sorts names A→Z case-insensitively without mutating the input", () => {
    const materials = [
      row({ id: "c", material: "Screws" }),
      row({ id: "a", material: "Blade" }),
      row({ id: "b", material: "cam lock" }),
    ];

    expect(sortMaterials(materials, "material", "asc").map((m) => m.id)).toEqual(
      ["a", "b", "c"],
    );
    expect(materials.map((m) => m.id)).toEqual(["c", "a", "b"]);
  });

  it("sorts names Z→A", () => {
    const materials = [
      row({ id: "a", material: "Blade" }),
      row({ id: "b", material: "cam lock" }),
      row({ id: "c", material: "Screws" }),
    ];

    expect(sortMaterials(materials, "material", "desc").map((m) => m.id)).toEqual(
      ["c", "b", "a"],
    );
  });

  it("sorts quantity numerically", () => {
    const materials = [
      row({ id: "a", material: "a", units: 10 }),
      row({ id: "b", material: "b", units: 2 }),
      row({ id: "c", material: "c", units: 5 }),
    ];

    expect(sortMaterials(materials, "units", "asc").map((m) => m.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
    expect(sortMaterials(materials, "units", "desc").map((m) => m.id)).toEqual([
      "a",
      "c",
      "b",
    ]);
  });

  it("sorts unit price numerically", () => {
    const materials = [
      row({ id: "a", material: "a", price: 1.5 }),
      row({ id: "b", material: "b", price: 0 }),
      row({ id: "c", material: "c", price: 12 }),
    ];

    expect(sortMaterials(materials, "price", "asc").map((m) => m.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
    expect(sortMaterials(materials, "price", "desc").map((m) => m.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });
});

describe("nextMaterialSort", () => {
  it("starts ascending on the first click", () => {
    expect(nextMaterialSort(null, "material")).toEqual({
      key: "material",
      direction: "asc",
    });
  });

  it("toggles direction on the same column", () => {
    expect(
      nextMaterialSort({ key: "material", direction: "asc" }, "material"),
    ).toEqual({ key: "material", direction: "desc" });
    expect(
      nextMaterialSort({ key: "material", direction: "desc" }, "material"),
    ).toEqual({ key: "material", direction: "asc" });
  });

  it("starts ascending when switching columns", () => {
    expect(
      nextMaterialSort({ key: "material", direction: "desc" }, "units"),
    ).toEqual({ key: "units", direction: "asc" });
  });
});
