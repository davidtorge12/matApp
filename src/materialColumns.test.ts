// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_COLUMN_VISIBILITY,
  MATERIALS_COLUMNS_KEY,
  parseColumnVisibility,
  readColumnVisibility,
  toggleColumn,
  writeColumnVisibility,
} from "./materialColumns";

afterEach(() => {
  window.localStorage.clear();
});

describe("parseColumnVisibility", () => {
  it("returns all columns on for missing or null input", () => {
    expect(parseColumnVisibility(undefined)).toEqual(DEFAULT_COLUMN_VISIBILITY);
    expect(parseColumnVisibility(null)).toEqual(DEFAULT_COLUMN_VISIBILITY);
    expect(parseColumnVisibility("nope")).toEqual(DEFAULT_COLUMN_VISIBILITY);
  });

  it("turns off only the keys that are explicitly false", () => {
    expect(parseColumnVisibility({ quantity: false })).toEqual({
      ...DEFAULT_COLUMN_VISIBILITY,
      quantity: false,
    });
  });

  it("ignores unknown keys", () => {
    expect(parseColumnVisibility({ nope: true, price: false })).toEqual({
      ...DEFAULT_COLUMN_VISIBILITY,
      price: false,
    });
  });

  it("defaults every known column to true", () => {
    expect(DEFAULT_COLUMN_VISIBILITY).toEqual({
      sorting: true,
      quantity: true,
      price: true,
      lineTotal: true,
      delete: true,
    });
  });
});

describe("toggleColumn", () => {
  it("flips one id and leaves the rest", () => {
    const next = toggleColumn(DEFAULT_COLUMN_VISIBILITY, "quantity");
    expect(next).toEqual({ ...DEFAULT_COLUMN_VISIBILITY, quantity: false });
    expect(toggleColumn(next, "quantity")).toEqual(DEFAULT_COLUMN_VISIBILITY);
  });
});

describe("readColumnVisibility", () => {
  it("returns all on when the key is missing", () => {
    expect(readColumnVisibility()).toEqual(DEFAULT_COLUMN_VISIBILITY);
  });

  it("returns all on when getItem throws", () => {
    const original = window.localStorage.getItem;
    window.localStorage.getItem = () => {
      throw new Error("denied");
    };
    expect(readColumnVisibility()).toEqual(DEFAULT_COLUMN_VISIBILITY);
    window.localStorage.getItem = original;
  });

  it("returns all on for invalid JSON", () => {
    window.localStorage.setItem(MATERIALS_COLUMNS_KEY, "{");
    expect(readColumnVisibility()).toEqual(DEFAULT_COLUMN_VISIBILITY);
  });
});

describe("writeColumnVisibility", () => {
  it("round-trips through localStorage", () => {
    const hiddenQty = { ...DEFAULT_COLUMN_VISIBILITY, quantity: false };
    writeColumnVisibility(hiddenQty);
    expect(readColumnVisibility()).toEqual(hiddenQty);
  });

  it("does not throw when setItem throws", () => {
    const original = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new Error("quota");
    };
    expect(() =>
      writeColumnVisibility(DEFAULT_COLUMN_VISIBILITY),
    ).not.toThrow();
    window.localStorage.setItem = original;
  });
});
