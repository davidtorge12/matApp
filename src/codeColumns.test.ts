// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  CODES_COLUMNS_KEY,
  DEFAULT_CODE_COLUMN_VISIBILITY,
  parseCodeColumnVisibility,
  readCodeColumnVisibility,
  toggleCodeColumn,
  writeCodeColumnVisibility,
} from "./codeColumns";

afterEach(() => {
  window.localStorage.clear();
});

describe("parseCodeColumnVisibility", () => {
  it("returns all columns on for missing or null input", () => {
    expect(parseCodeColumnVisibility(undefined)).toEqual(
      DEFAULT_CODE_COLUMN_VISIBILITY,
    );
    expect(parseCodeColumnVisibility(null)).toEqual(
      DEFAULT_CODE_COLUMN_VISIBILITY,
    );
  });

  it("turns off only the keys that are explicitly false", () => {
    expect(parseCodeColumnVisibility({ description: false })).toEqual({
      ...DEFAULT_CODE_COLUMN_VISIBILITY,
      description: false,
    });
  });

  it("ignores unknown keys", () => {
    expect(parseCodeColumnVisibility({ nope: true, copy: false })).toEqual({
      ...DEFAULT_CODE_COLUMN_VISIBILITY,
      copy: false,
    });
  });

  it("defaults every optional column to true", () => {
    expect(DEFAULT_CODE_COLUMN_VISIBILITY).toEqual({
      description: true,
      comments: true,
      materials: true,
      copy: true,
      search: true,
    });
  });

  it("turns search off when it is explicitly false", () => {
    expect(parseCodeColumnVisibility({ search: false })).toEqual({
      ...DEFAULT_CODE_COLUMN_VISIBILITY,
      search: false,
    });
  });
});

describe("toggleCodeColumn", () => {
  it("flips one id and leaves the rest", () => {
    const next = toggleCodeColumn(DEFAULT_CODE_COLUMN_VISIBILITY, "description");
    expect(next).toEqual({
      ...DEFAULT_CODE_COLUMN_VISIBILITY,
      description: false,
    });
  });
});

describe("readCodeColumnVisibility", () => {
  it("returns all on when the key is missing", () => {
    expect(readCodeColumnVisibility()).toEqual(DEFAULT_CODE_COLUMN_VISIBILITY);
  });

  it("returns all on when getItem throws", () => {
    const original = window.localStorage.getItem;
    window.localStorage.getItem = () => {
      throw new Error("denied");
    };
    expect(readCodeColumnVisibility()).toEqual(DEFAULT_CODE_COLUMN_VISIBILITY);
    window.localStorage.getItem = original;
  });
});

describe("writeCodeColumnVisibility", () => {
  it("round-trips through localStorage", () => {
    const hidden = { ...DEFAULT_CODE_COLUMN_VISIBILITY, description: false };
    writeCodeColumnVisibility(hidden);
    expect(window.localStorage.getItem(CODES_COLUMNS_KEY)).toBeTruthy();
    expect(readCodeColumnVisibility()).toEqual(hidden);
  });

  it("does not throw when setItem throws", () => {
    const original = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new Error("quota");
    };
    expect(() =>
      writeCodeColumnVisibility(DEFAULT_CODE_COLUMN_VISIBILITY),
    ).not.toThrow();
    window.localStorage.setItem = original;
  });
});
