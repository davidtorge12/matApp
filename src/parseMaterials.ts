export const REG_EXP_MATERIAL = /(\d{1,3}(?:\.\d+)?)\s*[xX]\s+/;

const QUANTITY_PREFIX = /^(\d+(?:\.\d+)?)\s*[xX]\s+(.*)$/;

export type ParsedMaterial = { units: number; name: string };

/**
 * Reads an explicit "12x screws" quantity prefix, or null when the text carries
 * no quantity at all.
 *
 * Separate from `parseMaterialLine` because the two callers need different
 * answers: aggregation wants a quantity either way and defaults to 1, while the
 * material name field must be able to tell "the user typed a quantity" from "the
 * user typed a bare name" — treating those the same reset the quantity column to
 * 1 on every keystroke.
 */
export function parseQuantityPrefix(line: string): ParsedMaterial | null {
  const match = line.trim().match(QUANTITY_PREFIX);
  if (!match) {
    return null;
  }

  const units = Number(match[1]);
  const name = match[2].trim();
  if (!name || !Number.isFinite(units)) {
    return null;
  }

  return { units, name };
}

/** As above, but a line with no quantity counts as one unit. */
export function parseMaterialLine(line: string): ParsedMaterial | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  return parseQuantityPrefix(trimmed) ?? { units: 1, name: trimmed };
}

export function canonicalMaterialName(material: string): string | null {
  return parseMaterialLine(material)?.name.trim().toLowerCase() ?? null;
}

export function splitMaterialLines(text: string): string[] {
  if (!text) {
    return [];
  }

  return text
    .split(/[\n;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Totals every material across a page of code rows, keyed by the first spelling
 * seen so "White Silicone" and "white silicone" become one line.
 */
export function aggregateMaterials(lines: string[]): Record<string, number> {
  const totals: Record<string, number> = {};
  const displayByCanonical: Record<string, string> = {};

  for (const line of lines) {
    for (const part of splitMaterialLines(line)) {
      const parsed = parseMaterialLine(part);
      if (!parsed) {
        continue;
      }

      const canonical = parsed.name.trim().toLowerCase();
      if (!canonical) {
        continue;
      }

      const display = displayByCanonical[canonical] ?? parsed.name.trim();
      displayByCanonical[canonical] = display;
      totals[display] = (totals[display] || 0) + parsed.units;
    }
  }

  return totals;
}
