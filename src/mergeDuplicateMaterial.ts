import { canonicalMaterialName, parseMaterialLine } from "./parseMaterials";
import { MaterialsType } from "./types";

export type MergeDuplicateResult =
  | { merged: false; materials: MaterialsType[] }
  | { merged: true; materials: MaterialsType[]; name: string };

export function mergeDuplicateMaterial(
  materials: MaterialsType[],
  rowId: string,
): MergeDuplicateResult {
  const current = materials.find((m) => m.id === rowId);
  const name = current ? canonicalMaterialName(current.material) : null;
  if (!current || !name) {
    return { merged: false, materials };
  }

  const existing = materials.find(
    (m) => m.id !== rowId && canonicalMaterialName(m.material) === name,
  );
  if (!existing) {
    return { merged: false, materials };
  }

  const units = existing.units + 1;
  return {
    merged: true,
    name: parseMaterialLine(existing.material)?.name ?? existing.material,
    materials: materials
      .filter((m) => m.id !== rowId)
      .map((m) => (m.id === existing.id ? { ...m, units } : m)),
  };
}
