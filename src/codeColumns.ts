export const CODES_COLUMNS_KEY = "matapp-codes-columns";

export const CODE_COLUMNS = [
  { id: "description", label: "Description" },
  { id: "comments", label: "Comments" },
  { id: "materials", label: "Materials" },
  { id: "copy", label: "Copy" },
] as const;

export const CODE_SETTINGS = [{ id: "search", label: "Search" }] as const;

export type CodeColumnId = (typeof CODE_COLUMNS)[number]["id"];
export type CodeSettingId =
  | CodeColumnId
  | (typeof CODE_SETTINGS)[number]["id"];

export type CodeColumnVisibility = Record<CodeSettingId, boolean>;

export const DEFAULT_CODE_COLUMN_VISIBILITY: CodeColumnVisibility = {
  description: true,
  comments: true,
  materials: true,
  copy: true,
  search: true,
};

const VISIBILITY_KEYS = [...CODE_COLUMNS, ...CODE_SETTINGS];

export function parseCodeColumnVisibility(raw: unknown): CodeColumnVisibility {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_CODE_COLUMN_VISIBILITY };
  }

  const next = { ...DEFAULT_CODE_COLUMN_VISIBILITY };
  for (const setting of VISIBILITY_KEYS) {
    const value = (raw as Record<string, unknown>)[setting.id];
    if (typeof value === "boolean") {
      next[setting.id] = value;
    }
  }
  return next;
}

export function toggleCodeColumn(
  current: CodeColumnVisibility,
  id: CodeSettingId,
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
