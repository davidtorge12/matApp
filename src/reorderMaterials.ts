import { arrayMove } from "@dnd-kit/sortable";
import { MaterialsType } from "./types";

export function reorderMaterials(
  materials: MaterialsType[],
  activeId: string,
  overId: string,
): MaterialsType[] {
  if (activeId === overId) {
    return materials;
  }

  const oldIndex = materials.findIndex((m) => m.id === activeId);
  const newIndex = materials.findIndex((m) => m.id === overId);
  if (oldIndex === -1 || newIndex === -1) {
    return materials;
  }

  return arrayMove(materials, oldIndex, newIndex);
}
