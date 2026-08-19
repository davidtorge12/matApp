// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  THEME_PREFERENCE_KEY,
  readThemePreference,
  writeThemePreference,
} from "./themePreference";

afterEach(() => {
  window.localStorage.clear();
});

describe("readThemePreference", () => {
  it("returns light when the key is missing", () => {
    expect(readThemePreference()).toBe("light");
  });

  it("returns a stored dark value", () => {
    window.localStorage.setItem(THEME_PREFERENCE_KEY, "dark");
    expect(readThemePreference()).toBe("dark");
  });

  it("returns light for an unknown or leftover system value", () => {
    window.localStorage.setItem(THEME_PREFERENCE_KEY, "system");
    expect(readThemePreference()).toBe("light");
  });

  it("returns light when getItem throws", () => {
    const original = window.localStorage.getItem;
    window.localStorage.getItem = () => {
      throw new Error("denied");
    };
    expect(readThemePreference()).toBe("light");
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
