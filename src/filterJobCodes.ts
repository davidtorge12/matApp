export type JobCodeFilter = {
  query?: string;
  needsMaterials?: boolean;
};

type FilterableCode = {
  code: string;
  description?: string;
  comments?: string;
  materials?: string;
};

export function codeHasMaterials(code: { materials?: string }): boolean {
  return Boolean(code.materials?.trim());
}

export function needsMaterialsCount(codes: { materials?: string }[]): number {
  return codes.reduce((count, code) => count + (codeHasMaterials(code) ? 0 : 1), 0);
}

export function filterJobCodes<T extends FilterableCode>(
  codes: T[],
  { query = "", needsMaterials = false }: JobCodeFilter = {},
): T[] {
  const needle = query.trim().toLowerCase();

  return codes.filter((row) => {
    if (needsMaterials && codeHasMaterials(row)) {
      return false;
    }

    if (!needle) {
      return true;
    }

    const haystack = [row.code, row.description, row.comments]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}
