// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  THEME_PREFERENCE_KEY,
  readThemePreference,
  resolveThemeMode,
  writeThemePreference,
} from "./themePreference";

afterEach(() => {
  window.localStorage.clear();
});

describe("readThemePreference", () => {
  it("returns system when the key is missing", () => {
    expect(readThemePreference()).toBe("system");
  });

  it("returns a stored light or dark value", () => {
    window.localStorage.setItem(THEME_PREFERENCE_KEY, "dark");
    expect(readThemePreference()).toBe("dark");
  });

  it("returns system for an unknown value", () => {
    window.localStorage.setItem(THEME_PREFERENCE_KEY, "nope");
    expect(readThemePreference()).toBe("system");
  });

  it("returns system when getItem throws", () => {
    const original = window.localStorage.getItem;
    window.localStorage.getItem = () => {
      throw new Error("denied");
    };
    expect(readThemePreference()).toBe("system");
    window.localStorage.getItem = original;
  });
});

describe("writeThemePreference", () => {
  it("stores the preference", () => {
    writeThemePreference("light");
    expect(window.localStorage.getItem(THEME_PREFERENCE_KEY)).toBe("light");
  });

  it("does not throw when setItem throws", () => {
    const original = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new Error("quota");
    };
    expect(() => writeThemePreference("dark")).not.toThrow();
    window.localStorage.setItem = original;
  });
});

describe("resolveThemeMode", () => {
  it("follows the OS when preference is system", () => {
    expect(resolveThemeMode("system", true)).toBe("dark");
    expect(resolveThemeMode("system", false)).toBe("light");
  });

  it("ignores the OS when preference is light or dark", () => {
    expect(resolveThemeMode("light", true)).toBe("light");
    expect(resolveThemeMode("dark", false)).toBe("dark");
  });
});
