// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import AppBarMenu from "../AppBar";
import { APP_BAR_ACTIONS_ID, APP_BAR_CHIP_ID } from "../AppBarActions";
import { ThemePreferenceProvider } from "../../ThemePreferenceContext";

function renderBar(path = "/") {
  return render(
    <ThemePreferenceProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppBarMenu />
      </MemoryRouter>
    </ThemePreferenceProvider>,
  );
}

describe("AppBarMenu", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps page tabs and the theme toggle on the first row", () => {
    renderBar();

    expect(screen.getByRole("link", { name: "Mat App home" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Materials" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "VO" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Switch to dark" }),
    ).toBeInTheDocument();
    expect(document.getElementById(APP_BAR_ACTIONS_ID)).toBeInTheDocument();
    expect(document.getElementById(APP_BAR_CHIP_ID)).toBeInTheDocument();
  });
});
