export const MATERIALS_COLUMNS_KEY = "matapp-materials-columns";

export const MATERIAL_COLUMNS = [
  { id: "sorting", label: "Sorting" },
  { id: "quantity", label: "Quantity" },
  { id: "price", label: "Price" },
  { id: "lineTotal", label: "Line total" },
  { id: "delete", label: "Delete" },
] as const;

export const MATERIAL_SETTINGS = [
  { id: "search", label: "Search" },
] as const;

export type MaterialColumnId = (typeof MATERIAL_COLUMNS)[number]["id"];
export type MaterialSettingId =
  | MaterialColumnId
  | (typeof MATERIAL_SETTINGS)[number]["id"];

export type ColumnVisibility = Record<MaterialSettingId, boolean>;

export const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  sorting: true,
  quantity: true,
  price: true,
  lineTotal: true,
  delete: true,
  search: true,
};

const VISIBILITY_KEYS = [...MATERIAL_COLUMNS, ...MATERIAL_SETTINGS];

export function parseColumnVisibility(raw: unknown): ColumnVisibility {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_COLUMN_VISIBILITY };
  }

  const next = { ...DEFAULT_COLUMN_VISIBILITY };
  for (const setting of VISIBILITY_KEYS) {
    const value = (raw as Record<string, unknown>)[setting.id];
    if (typeof value === "boolean") {
      next[setting.id] = value;
    }
  }
  return next;
}

export function toggleColumn(
  current: ColumnVisibility,
  id: MaterialSettingId,
): ColumnVisibility {
  return { ...current, [id]: !current[id] };
}

export function readColumnVisibility(): ColumnVisibility {
  try {
    const stored = localStorage.getItem(MATERIALS_COLUMNS_KEY);
    if (!stored) {
      return { ...DEFAULT_COLUMN_VISIBILITY };
    }
    return parseColumnVisibility(JSON.parse(stored));
  } catch {
    return { ...DEFAULT_COLUMN_VISIBILITY };
  }
}

export function writeColumnVisibility(visibility: ColumnVisibility): void {
  try {
    localStorage.setItem(MATERIALS_COLUMNS_KEY, JSON.stringify(visibility));
  } catch {
    // Quota or privacy errors must not break the in-memory columns.
  }
}
