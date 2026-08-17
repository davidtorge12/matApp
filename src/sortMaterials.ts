import { MaterialsType } from "./types";

export type MaterialSortKey = "material" | "units" | "price";
export type SortDirection = "asc" | "desc";
export type MaterialSort = { key: MaterialSortKey; direction: SortDirection };

function compare(a: MaterialsType, b: MaterialsType, key: MaterialSortKey): number {
  if (key === "material") {
    return a.material.localeCompare(b.material, undefined, { sensitivity: "base" });
  }
  return a[key] - b[key];
}

export function sortMaterials(
  materials: MaterialsType[],
  key: MaterialSortKey,
  direction: SortDirection,
): MaterialsType[] {
  const sign = direction === "asc" ? 1 : -1;
  return [...materials].sort((a, b) => sign * compare(a, b, key));
}

export function nextMaterialSort(
  current: MaterialSort | null,
  clickedKey: MaterialSortKey,
): MaterialSort {
  if (current?.key === clickedKey) {
    return {
      key: clickedKey,
      direction: current.direction === "asc" ? "desc" : "asc",
    };
  }
  return { key: clickedKey, direction: "asc" };
}
