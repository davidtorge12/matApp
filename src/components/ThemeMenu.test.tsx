// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@mui/material/styles";
import ThemeMenu from "./ThemeMenu";
import { ThemePreferenceContext } from "../ThemePreferenceContext";
import { createAppTheme } from "../theme";

function renderMenu(
  preference: "light" | "dark" | "system" = "system",
  setPreference = vi.fn(),
) {
  render(
    <ThemePreferenceContext.Provider value={{ preference, setPreference }}>
      <ThemeProvider theme={createAppTheme("light")}>
        <ThemeMenu />
      </ThemeProvider>
    </ThemePreferenceContext.Provider>,
  );
  return setPreference;
}

describe("ThemeMenu", () => {
  it("opens a menu and reports Dark when that item is chosen", async () => {
    const user = userEvent.setup();
    const setPreference = renderMenu("system");

    await user.click(screen.getByRole("button", { name: "Theme: System" }));
    await user.click(screen.getByRole("menuitem", { name: "Dark" }));

    expect(setPreference).toHaveBeenCalledWith("dark");
  });
});
