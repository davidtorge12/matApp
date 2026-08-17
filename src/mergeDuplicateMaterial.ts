import { canonicalMaterialName, parseMaterialLine } from "./parseMaterials";
import { MaterialsType } from "./types";

export type MergeDuplicateResult =
  | { merged: false; materials: MaterialsType[] }
  | { merged: true; materials: MaterialsType[]; name: string };

/**
 * Folds a row into an earlier row with the same material name.
 *
 * The duplicate's own quantity is carried over rather than counting as one:
 * typing "3x screws" onto a list that already has 2 screws has to end at 5, not
 * 3. A row still sitting at its default of 0 or 1 counts as one, which is what
 * adding a blank row and naming it means.
 */
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

  const added = current.units > 0 ? current.units : 1;

  return {
    merged: true,
    name: parseMaterialLine(existing.material)?.name ?? existing.material,
    materials: materials
      .filter((m) => m.id !== rowId)
      .map((m) =>
        m.id === existing.id ? { ...m, units: existing.units + added } : m,
      ),
  };
}
