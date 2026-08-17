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

export function aggregateMaterials(lines: string[]): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const line of lines) {
    const parsed = parseMaterialLine(line);
    if (!parsed) {
      continue;
    }

    totals[parsed.name] = (totals[parsed.name] || 0) + parsed.units;
  }

  return totals;
}
