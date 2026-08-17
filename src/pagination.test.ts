import { describe, expect, it } from "vitest";
import { PAGE_SIZE, latestCodesPath, pageRows } from "./pagination";

describe("PAGE_SIZE", () => {
  it("is 20 rows per page", () => {
    expect(PAGE_SIZE).toBe(20);
  });
});

describe("pageRows", () => {
  const items = Array.from({ length: 45 }, (_, i) => i);

  it("returns 20 rows for a client-side page", () => {
    expect(pageRows(items, 0)).toEqual(items.slice(0, 20));
    expect(pageRows(items, 1)).toEqual(items.slice(20, 40));
  });

  it("returns the remaining rows on the last page", () => {
    expect(pageRows(items, 2)).toEqual(items.slice(40, 45));
  });

  it("does not slice rows that are already a server page", () => {
    const serverPage = items.slice(20, 40);
    expect(pageRows(serverPage, 1, { serverPaged: true })).toEqual(serverPage);
  });
});

describe("latestCodesPath", () => {
  it("requests a 1-based page query", () => {
    expect(latestCodesPath(1)).toBe("/latest?page=1");
    expect(latestCodesPath(3)).toBe("/latest?page=3");
  });

  it("falls back to page 1 for invalid values", () => {
    expect(latestCodesPath(0)).toBe("/latest?page=1");
    expect(latestCodesPath(-2)).toBe("/latest?page=1");
    expect(latestCodesPath(1.8)).toBe("/latest?page=1");
  });
});
