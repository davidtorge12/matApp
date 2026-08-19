export const CODES_COLUMNS_KEY = "matapp-codes-columns";

export const CODE_COLUMNS = [
  { id: "description", label: "Description" },
  { id: "comments", label: "Comments" },
  { id: "materials", label: "Materials" },
  { id: "copy", label: "Copy" },
] as const;

export type CodeColumnId = (typeof CODE_COLUMNS)[number]["id"];

export type CodeColumnVisibility = Record<CodeColumnId, boolean>;

export const DEFAULT_CODE_COLUMN_VISIBILITY: CodeColumnVisibility = {
  description: true,
  comments: true,
  materials: true,
  copy: true,
};

export function parseCodeColumnVisibility(raw: unknown): CodeColumnVisibility {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_CODE_COLUMN_VISIBILITY };
  }

  const next = { ...DEFAULT_CODE_COLUMN_VISIBILITY };
  for (const column of CODE_COLUMNS) {
    const value = (raw as Record<string, unknown>)[column.id];
    if (typeof value === "boolean") {
      next[column.id] = value;
    }
  }
  return next;
}

export function toggleCodeColumn(
  current: CodeColumnVisibility,
  id: CodeColumnId,
): CodeColumnVisibility {
  return { ...current, [id]: !current[id] };
}

export function readCodeColumnVisibility(): CodeColumnVisibility {
  try {
    const stored = localStorage.getItem(CODES_COLUMNS_KEY);
    if (!stored) {
      return { ...DEFAULT_CODE_COLUMN_VISIBILITY };
    }
    return parseCodeColumnVisibility(JSON.parse(stored));
  } catch {
    return { ...DEFAULT_CODE_COLUMN_VISIBILITY };
  }
}

export function writeCodeColumnVisibility(
  visibility: CodeColumnVisibility,
): void {
  try {
    localStorage.setItem(CODES_COLUMNS_KEY, JSON.stringify(visibility));
  } catch {
    // Quota or privacy errors must not break the in-memory columns.
  }
}
