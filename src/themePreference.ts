import type { ThemeMode } from "./theme";

export type ThemePreference = "light" | "dark" | "system";

export const THEME_PREFERENCE_KEY = "matapp-theme-preference";

const PREFERENCES: ReadonlySet<string> = new Set(["light", "dark", "system"]);

export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_PREFERENCE_KEY);
    if (stored && PREFERENCES.has(stored)) {
      return stored as ThemePreference;
    }
  } catch {
    // Private mode and blocked storage should look like a first visit.
  }
  return "system";
}

export function writeThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_PREFERENCE_KEY, preference);
  } catch {
    // Quota or privacy errors must not break the in-memory theme.
  }
}

export function resolveThemeMode(
  preference: ThemePreference,
  osDark: boolean,
): ThemeMode {
  if (preference === "system") {
    return osDark ? "dark" : "light";
  }
  return preference;
}
