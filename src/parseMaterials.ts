export const REG_EXP_MATERIAL = /(\d{1,3}(?:\.\d+)?)\s*[xX]\s+/;

export function parseMaterialLine(
  line: string
): { units: number; name: string } | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*[xX]\s+(.*)$/);
  if (match) {
    const units = Number(match[1]);
    const name = match[2].trim();
    if (!name || Number.isNaN(units)) {
      return { units: 1, name: trimmed };
    }
    return { units, name };
  }

  return { units: 1, name: trimmed };
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
