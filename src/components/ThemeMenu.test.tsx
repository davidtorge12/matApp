// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@mui/material/styles";
import ThemeMenu from "./ThemeMenu";
import { ThemePreferenceContext } from "../ThemePreferenceContext";
import { createAppTheme } from "../theme";

function renderToggle(
  preference: "light" | "dark" = "light",
  setPreference = vi.fn(),
) {
  render(
    <ThemePreferenceContext.Provider value={{ preference, setPreference }}>
      <ThemeProvider theme={createAppTheme(preference)}>
        <ThemeMenu />
      </ThemeProvider>
    </ThemePreferenceContext.Provider>,
  );
  return setPreference;
}

describe("ThemeMenu", () => {
  it("switches to dark on one tap from light, without a menu", async () => {
    const user = userEvent.setup();
    const setPreference = renderToggle("light");

    await user.click(screen.getByRole("button", { name: "Switch to dark" }));

    expect(setPreference).toHaveBeenCalledWith("dark");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("switches to light on one tap from dark", async () => {
    const user = userEvent.setup();
    const setPreference = renderToggle("dark");

    await user.click(screen.getByRole("button", { name: "Switch to light" }));

    expect(setPreference).toHaveBeenCalledWith("light");
  });
});
