type FilterableMaterial = {
  material: string;
};

export function filterMaterials<T extends FilterableMaterial>(
  materials: T[],
  query: string,
): T[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return materials;
  }

  return materials.filter((row) => row.material.toLowerCase().includes(needle));
}
