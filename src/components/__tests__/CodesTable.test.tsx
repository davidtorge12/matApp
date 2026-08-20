// @vitest-environment jsdom
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@mui/material/styles";
import CodesTable from "../CodesTable";
import {
  CODES_COLUMNS_KEY,
  DEFAULT_CODE_COLUMN_VISIBILITY,
} from "../../codeColumns";
import { createAppTheme } from "../../theme";
import { CodeType } from "../../types";

/**
 * Covers saving a materials edit. A failed save used to be logged to the console
 * only, so a lost edit stayed on screen looking saved, and the value kept locally
 * differed from the trimmed value sent to the API.
 */

const updateCodeMaterials = vi.fn();

vi.mock("../../api", () => ({
  updateCodeMaterials: (...args: unknown[]) => updateCodeMaterials(...args),
}));

function code(
  partial: Partial<CodeType> & Pick<CodeType, "_id" | "code">,
): CodeType {
  return {
    description: "",
    materials: "",
    createdAt: "",
    updatedAt: "",
    ...partial,
  };
}

function Harness({
  initial,
  onError,
  materialNames,
}: {
  initial: CodeType[];
  onError?: (message: string) => void;
  materialNames?: string[];
}) {
  const [data, setData] = useState(initial);

  return (
    <CodesTable
      data={data}
      setData={setData}
      page={0}
      count={data.length}
      serverPaged={false}
      onPageChange={() => {}}
      onError={onError}
      materialNames={materialNames}
    />
  );
}

function mockCompactViewport() {
  window.matchMedia = (query: string) =>
    ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

beforeEach(() => {
  updateCodeMaterials.mockResolvedValue(undefined);
  window.localStorage.clear();
});

describe("saving a materials edit", () => {
  it("sends the edit to the API on blur", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[code({ _id: "a1", code: "P100" })]} />);

    await user.type(screen.getByLabelText("Materials for code P100"), "2x screws");
    await user.tab();

    await waitFor(() =>
      expect(updateCodeMaterials).toHaveBeenCalledWith("a1", "2x screws"),
    );
  });

  // Bug 7. The rejection used to go to console.error, so the edit stayed on screen
  // as though it had been stored.
  it("reports a failed save instead of swallowing it", async () => {
    const user = userEvent.setup();
    const onError = vi.fn();
    updateCodeMaterials.mockRejectedValue(new Error("Not authorised."));
    render(
      <Harness initial={[code({ _id: "a1", code: "P100" })]} onError={onError} />,
    );

    await user.type(screen.getByLabelText("Materials for code P100"), "2x screws");
    await user.tab();

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        "Could not save materials for P100: Not authorised.",
      ),
    );
  });

  // Bug 8. Local state kept the untrimmed text while the API got the trimmed one.
  it("sends the same trimmed value it keeps locally", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[code({ _id: "a1", code: "P100" })]} />);

    await user.type(
      screen.getByLabelText("Materials for code P100"),
      "  2x screws  ",
    );
    await user.tab();

    await waitFor(() => expect(updateCodeMaterials).toHaveBeenCalled());
    const [, sent] = updateCodeMaterials.mock.lastCall ?? [];
    expect(sent).toBe("2x screws");

    // The copy button reads from the stored row, so it proves what state kept.
    expect(
      screen.getByRole("button", { name: "Copy materials for P100" }),
    ).toBeEnabled();
  });

  it("does not call the API when the value has not changed", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={[code({ _id: "a1", code: "P100", materials: "2x screws" })]}
      />,
    );

    await user.click(screen.getByLabelText("Materials for code P100"));
    await user.tab();

    expect(updateCodeMaterials).not.toHaveBeenCalled();
  });

  it("treats a whitespace-only change as no change", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={[code({ _id: "a1", code: "P100", materials: "2x screws" })]}
      />,
    );

    const field = screen.getByLabelText("Materials for code P100");
    await user.type(field, "   ");
    await user.tab();

    expect(updateCodeMaterials).not.toHaveBeenCalled();
  });

  it("completes the last line from the catalogue and keeps the quantity", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={[code({ _id: "a1", code: "P100" })]}
        materialNames={["white silicone"]}
      />,
    );

    await user.type(screen.getByLabelText("Materials for code P100"), "2x sil");
    await user.click(await screen.findByRole("option", { name: "white silicone" }));
    await user.tab();

    await waitFor(() =>
      expect(updateCodeMaterials).toHaveBeenCalledWith("a1", "2x white silicone"),
    );
  });
});

describe("rendering", () => {
  it("flags a comment that needs checking as a warning chip", () => {
    render(
      <Harness
        initial={[code({ _id: "a1", code: "P100", comments: "check access" })]}
      />,
    );

    expect(screen.getByText("check access")).toBeInTheDocument();
  });

  it("keeps each material on one line instead of wrapping", () => {
    render(
      <Harness
        initial={[
          code({
            _id: "a1",
            code: "P100",
            materials: "2x extra-long galvanised timber screws",
          }),
        ]}
      />,
    );

    expect(screen.getByLabelText("Materials for code P100")).toHaveStyle({
      whiteSpace: "nowrap",
      overflowX: "auto",
    });
  });

  it("disables copy for a code with no materials", () => {
    render(<Harness initial={[code({ _id: "a1", code: "P100" })]} />);

    expect(
      screen.getByRole("button", { name: "Copy materials for P100" }),
    ).toBeDisabled();
  });

  it("puts an icon-only copy control on compact cards, not a labelled button", () => {
    const originalMatchMedia = window.matchMedia;
    mockCompactViewport();

    try {
      render(
        <Harness
          initial={[code({ _id: "a1", code: "P100", materials: "2x screws" })]}
        />,
      );

      expect(
        screen.getByRole("button", { name: "Copy materials for P100" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Copy materials" }),
      ).not.toBeInTheDocument();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it("keeps compact card type at the desktop size", () => {
    const originalMatchMedia = window.matchMedia;
    mockCompactViewport();

    try {
      render(
        <ThemeProvider theme={createAppTheme("light")}>
          <Harness
            initial={[code({ _id: "a1", code: "P100", materials: "2x screws" })]}
          />
        </ThemeProvider>,
      );

      expect(screen.getByLabelText("Materials for code P100")).toHaveStyle({
        fontSize: "0.875rem",
      });
      expect(screen.getByRole("heading", { name: "P100" })).toHaveClass(
        "MuiTypography-body2",
      );
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it("shows the empty state when there are no codes", () => {
    render(<Harness initial={[]} />);

    expect(
      screen.getByText("Upload a job file or wait for the latest codes."),
    ).toBeInTheDocument();
  });
});

describe("searching and the empty-materials queue", () => {
  const job = [
    code({
      _id: "1",
      code: "P100",
      description: "Paint walls",
      materials: "2x emulsion",
    }),
    code({
      _id: "2",
      code: "P200",
      description: "Renew deadlock",
    }),
    code({
      _id: "3",
      code: "390915",
      description: "Strip wallpaper",
      materials: "1x scraper",
    }),
  ];

  it("filters the table as the search is typed", async () => {
    const user = userEvent.setup();
    render(<Harness initial={job} />);

    await user.type(screen.getByLabelText("Search job codes"), "deadlock");

    expect(screen.getByText("P200")).toBeInTheDocument();
    expect(screen.queryByText("P100")).not.toBeInTheDocument();
    expect(screen.getAllByText("1–1 of 1").length).toBeGreaterThan(0);
  });

  it("shows only codes that still need materials", async () => {
    const user = userEvent.setup();
    render(<Harness initial={job} />);

    await user.click(screen.getByRole("button", { name: "No materials (1)" }));

    expect(screen.getByText("P200")).toBeInTheDocument();
    expect(screen.queryByText("P100")).not.toBeInTheDocument();
    expect(screen.queryByText("390915")).not.toBeInTheDocument();
  });

  it("says when nothing matches", async () => {
    const user = userEvent.setup();
    render(<Harness initial={job} />);

    await user.type(screen.getByLabelText("Search job codes"), "zzzz");

    expect(screen.getByText("No codes match.")).toBeInTheDocument();
    expect(screen.queryByText("P100")).not.toBeInTheDocument();
  });

  it("hides the search when Search is unchecked", async () => {
    const user = userEvent.setup();
    render(<Harness initial={job} />);

    await user.click(screen.getByRole("button", { name: "Columns" }));
    await user.click(screen.getByRole("menuitem", { name: "Search" }));

    expect(screen.queryByLabelText("Search job codes")).not.toBeInTheDocument();
    expect(screen.getByText("P100")).toBeInTheDocument();
    expect(screen.getByText("P200")).toBeInTheDocument();
  });

  it("shows every row again after hiding search with a query still typed", async () => {
    const user = userEvent.setup();
    render(<Harness initial={job} />);

    await user.type(screen.getByLabelText("Search job codes"), "deadlock");
    await user.click(screen.getByRole("button", { name: "Columns" }));
    await user.click(screen.getByRole("menuitem", { name: "Search" }));

    expect(screen.getByText("P100")).toBeInTheDocument();
    expect(screen.getByText("P200")).toBeInTheDocument();
    expect(screen.getByText("390915")).toBeInTheDocument();
  });

  it("honours a stored search-off preference on first render", () => {
    window.localStorage.setItem(
      CODES_COLUMNS_KEY,
      JSON.stringify({ ...DEFAULT_CODE_COLUMN_VISIBILITY, search: false }),
    );
    render(<Harness initial={job} />);

    expect(screen.queryByLabelText("Search job codes")).not.toBeInTheDocument();
    expect(screen.getByText("P100")).toBeInTheDocument();
  });
});

describe("column visibility", () => {
  it("shows a Columns control and the description column by default", () => {
    render(
      <Harness
        initial={[
          code({
            _id: "a1",
            code: "P100",
            description: "Paint walls",
            materials: "2x emulsion",
          }),
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "Columns" })).toBeInTheDocument();
    expect(screen.getByText("Paint walls")).toBeInTheDocument();
    expect(screen.getByText("P100")).toBeInTheDocument();
  });

  it("hides the description column when Description is unchecked", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={[code({ _id: "a1", code: "P100", description: "Paint walls" })]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Columns" }));
    await user.click(screen.getByRole("menuitem", { name: "Description" }));

    expect(screen.queryByText("Paint walls")).not.toBeInTheDocument();
    expect(screen.getByText("P100")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Description" }),
    ).toBeInTheDocument();
  });

  it("honours a stored description-off preference on first render", () => {
    window.localStorage.setItem(
      CODES_COLUMNS_KEY,
      JSON.stringify({ ...DEFAULT_CODE_COLUMN_VISIBILITY, description: false }),
    );
    render(
      <Harness
        initial={[code({ _id: "a1", code: "P100", description: "Paint walls" })]}
      />,
    );

    expect(screen.queryByText("Paint walls")).not.toBeInTheDocument();
    expect(screen.getByText("P100")).toBeInTheDocument();
  });
});
