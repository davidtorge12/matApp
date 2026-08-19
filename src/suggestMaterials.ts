import { parseMaterialLine, parseQuantityPrefix } from "./parseMaterials";

const DEFAULT_LIMIT = 8;

export function catalogueNames(sources: string[][]): string[] {
  const displayByCanonical = new Map<string, string>();

  for (const list of sources) {
    for (const raw of list) {
      const name = raw.trim();
      if (!name) {
        continue;
      }

      const canonical = name.toLowerCase();
      if (!displayByCanonical.has(canonical)) {
        displayByCanonical.set(canonical, name);
      }
    }
  }

  return [...displayByCanonical.values()].sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: "base" }),
  );
}

function typedName(query: string): string {
  const trimmed = query.trim();
  if (!trimmed || /^\d+(?:\.\d+)?\s*[xX]\s*$/.test(trimmed)) {
    return "";
  }

  return (
    (parseQuantityPrefix(trimmed) ?? parseMaterialLine(trimmed))?.name
      .trim()
      .toLowerCase() ?? ""
  );
}

export function suggestMaterials(
  query: string,
  names: string[],
  limit = DEFAULT_LIMIT,
): string[] {
  const needle = typedName(query);
  if (!needle) {
    return [];
  }

  const starts: string[] = [];
  const contains: string[] = [];

  for (const name of names) {
    const lower = name.toLowerCase();
    if (lower === needle) {
      continue;
    }
    if (lower.startsWith(needle)) {
      starts.push(name);
    } else if (lower.includes(needle)) {
      contains.push(name);
    }
  }

  return [...starts, ...contains].slice(0, limit);
}

export function applyMaterialSuggestion(line: string, name: string): string {
  const quantity = parseQuantityPrefix(line);
  if (quantity) {
    return `${quantity.units}x ${name}`;
  }
  return name;
}

export function applySuggestionToLastLine(text: string, name: string): string {
  if (!text) {
    return name;
  }

  const lines = text.split("\n");
  const last = lines.length - 1;
  lines[last] = applyMaterialSuggestion(lines[last] ?? "", name);
  return lines.join("\n");
}
