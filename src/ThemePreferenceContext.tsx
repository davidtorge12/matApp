import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
// Path imports, not the `@mui/material` barrel: mixing that barrel with
// `createTheme` from `@mui/material/styles` in this module graph leaves
// `createTheme` undefined (`createTheme_default is not a function`).
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "./theme";
import {
  readThemePreference,
  writeThemePreference,
  type ThemePreference,
} from "./themePreference";

export type ThemePreferenceContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

export const ThemePreferenceContext =
  createContext<ThemePreferenceContextValue | null>(null);

export function useThemePreference(): ThemePreferenceContextValue {
  const value = useContext(ThemePreferenceContext);
  if (!value) {
    throw new Error(
      "useThemePreference must be used within ThemePreferenceProvider",
    );
  }
  return value;
}

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(readThemePreference);
  const theme = useMemo(() => createAppTheme(preference), [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    writeThemePreference(next);
    setPreferenceState(next);
  }, []);

  const value = useMemo(
    () => ({ preference, setPreference }),
    [preference, setPreference],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </ThemePreferenceContext.Provider>
  );
}
