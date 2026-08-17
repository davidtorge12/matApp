export const PAGE_SIZE = 20;

export function pageRows<T>(
  rows: T[],
  page: number,
  options?: { serverPaged?: boolean },
): T[] {
  if (options?.serverPaged) {
    return rows;
  }

  const start = page * PAGE_SIZE;
  return rows.slice(start, start + PAGE_SIZE);
}

/** Index of the last page, for the compact previous/next pager on phones. */
export function lastPageIndex(count: number): number {
  if (!Number.isFinite(count) || count <= 0) {
    return 0;
  }

  return Math.max(0, Math.ceil(count / PAGE_SIZE) - 1);
}

export function latestCodesPath(page: number): string {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  return `/latest?page=${safePage}`;
}
