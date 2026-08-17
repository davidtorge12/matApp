import { arrayMove } from "@dnd-kit/sortable";
import { MaterialsType } from "./types";

/**
 * Moves one row by a relative offset. Backs the up/down buttons that stand in
 * for drag and drop on touch, where dragging inside a scrolling list is fiddly
 * and unavailable to screen reader users.
 */
export function moveMaterial(
  materials: MaterialsType[],
  id: string,
  offset: number,
): MaterialsType[] {
  const from = materials.findIndex((m) => m.id === id);
  if (from === -1 || !offset) {
    return materials;
  }

  const to = from + offset;
  if (to < 0 || to >= materials.length) {
    return materials;
  }

  return arrayMove(materials, from, to);
}
