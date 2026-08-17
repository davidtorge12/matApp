import { describe, expect, it } from "vitest";
import { mergeDuplicateMaterial } from "./mergeDuplicateMaterial";
import { MaterialsType } from "./types";

function row(
  partial: Partial<MaterialsType> & Pick<MaterialsType, "id" | "material">,
): MaterialsType {
  return { price: 0, units: 1, ...partial };
}

describe("mergeDuplicateMaterial", () => {
  it("returns unchanged when the name is unique", () => {
    const materials = [
      row({ id: "a", material: "screws", units: 2 }),
      row({ id: "b", material: "blade", units: 1 }),
    ];

    expect(mergeDuplicateMaterial(materials, "b")).toEqual({
      merged: false,
      materials,
    });
  });

  it("increments the existing row by one and removes the duplicate", () => {
    const materials = [
      row({ id: "a", material: "screws", units: 2, price: 1.5 }),
      row({ id: "b", material: "screws", units: 1 }),
    ];

    expect(mergeDuplicateMaterial(materials, "b")).toEqual({
      merged: true,
      name: "screws",
      materials: [row({ id: "a", material: "screws", units: 3, price: 1.5 })],
    });
  });

  it("increments by one when the new row still has 0 units", () => {
    const materials = [
      row({ id: "a", material: "screws", units: 4 }),
      row({ id: "b", material: "screws", units: 0 }),
    ];

    expect(mergeDuplicateMaterial(materials, "b")).toEqual({
      merged: true,
      name: "screws",
      materials: [row({ id: "a", material: "screws", units: 5 })],
    });
  });

  it("matches names case-insensitively and ignores extra spaces", () => {
    const materials = [
      row({ id: "a", material: "Cam lock" }),
      row({ id: "b", material: "  cam lock  " }),
    ];

    expect(mergeDuplicateMaterial(materials, "b")).toEqual({
      merged: true,
      name: "Cam lock",
      materials: [row({ id: "a", material: "Cam lock", units: 2 })],
    });
  });

  it("matches a typed quantity prefix against the existing name", () => {
    const materials = [
      row({ id: "a", material: "screws", units: 2 }),
      row({ id: "b", material: "3x screws", units: 3 }),
    ];

    expect(mergeDuplicateMaterial(materials, "b")).toEqual({
      merged: true,
      name: "screws",
      materials: [row({ id: "a", material: "screws", units: 3 })],
    });
  });

  it("does not merge a blank name", () => {
    const materials = [
      row({ id: "a", material: "screws" }),
      row({ id: "b", material: "   ", units: 0 }),
    ];

    expect(mergeDuplicateMaterial(materials, "b")).toEqual({
      merged: false,
      materials,
    });
  });

  it("does not merge a row with itself", () => {
    const materials = [row({ id: "a", material: "screws", units: 2 })];

    expect(mergeDuplicateMaterial(materials, "a")).toEqual({
      merged: false,
      materials,
    });
  });
});
