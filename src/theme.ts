import { createTheme, Theme } from "@mui/material/styles";

export type ThemeMode = "light" | "dark";

/**
 * Minimum comfortable touch target. WCAG 2.5.8 sets a 24px floor, Apple's HIG
 * recommends 44px and Material 48px; 44 is the practical middle for a tool used
 * one-handed on a phone.
 */
const TOUCH_TARGET = 44;

/**
 * Phone keyboards zoom the page when a focused input renders below 16px, so
 * inputs stay at 1rem on small screens and only tighten up on wider ones.
 */
const MOBILE_INPUT_FONT_SIZE = "1rem";
const DESKTOP_INPUT_FONT_SIZE = "0.875rem";

const lightPalette = {
  // #1565c0 clears 4.5:1 on white; the previous #1976d2 sat at ~4.6:1 only
  // against pure white and failed against the #fafafa page background.
  primary: { main: "#1565c0" },
  background: { default: "#fafafa", paper: "#ffffff" },
} as const;

const darkPalette = {
  primary: { main: "#90caf9" },
  background: { default: "#121212", paper: "#1e1e1e" },
} as const;

export function createAppTheme(mode: ThemeMode): Theme {
  return createTheme({
    palette: {
      mode,
      ...(mode === "dark" ? darkPalette : lightPalette),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      // 12px secondary text is hard to read at arm's length on a phone.
      body2: { fontSize: "0.875rem" },
      caption: { fontSize: "0.8125rem" },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            // Stops phone browsers inflating text in unexpected orientations.
            WebkitTextSizeAdjust: "100%",
          },
          body: {
            // Keeps the notch and home indicator clear of app chrome once
            // index.html opts into viewport-fit=cover.
            paddingLeft: "env(safe-area-inset-left)",
            paddingRight: "env(safe-area-inset-right)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            // Sentence case reads measurably faster than all caps.
            textTransform: "none",
            fontWeight: 600,
            [theme.breakpoints.down("sm")]: {
              minHeight: TOUCH_TARGET,
            },
          }),
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            [theme.breakpoints.down("sm")]: {
              minWidth: TOUCH_TARGET,
              minHeight: TOUCH_TARGET,
            },
          }),
        },
      },
      MuiInputBase: {
        styleOverrides: {
          input: ({ theme }) => ({
            fontSize: MOBILE_INPUT_FONT_SIZE,
            [theme.breakpoints.up("sm")]: {
              fontSize: DESKTOP_INPUT_FONT_SIZE,
            },
          }),
        },
      },
      MuiTextField: {
        defaultProps: {
          size: "small",
        },
      },
      MuiChip: {
        defaultProps: {
          size: "small",
        },
        styleOverrides: {
          deleteIcon: ({ theme }) => ({
            [theme.breakpoints.down("sm")]: {
              width: 22,
              height: 22,
            },
          }),
        },
      },
      MuiTable: {
        defaultProps: {
          size: "small",
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            minHeight: 48,
          },
        },
      },
      MuiTooltip: {
        defaultProps: {
          // Tooltips are hover-only affordances; on touch they need a long
          // press, so every tooltipped control also carries a visible or
          // screen-reader label.
          enterTouchDelay: 400,
        },
      },
    },
  });
}

export default createAppTheme("light");
