// @vitest-environment jsdom
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@mui/material/styles";
import MaterialsList from "../MaterialsList";
import {
  DEFAULT_COLUMN_VISIBILITY,
  MATERIALS_COLUMNS_KEY,
} from "../../materialColumns";
import { materialsTotal } from "../../money";
import { createAppTheme } from "../../theme";
import { MaterialsType } from "../../types";

/**
 * Regression cover for the interaction bugs in the materials list. Each of these
 * lived in the wiring between the row and the list, so none of them was reachable
 * from the pure-helper tests.
 */

function Harness({
  initial,
  onSavePrice = () => {},
  materialNames = [],
}: {
  initial: MaterialsType[];
  onSavePrice?: (material: string, price: number) => void;
  materialNames?: string[];
}) {
  const [materials, setMaterials] = useState(initial);

  return (
    <MaterialsList
      address=""
      allMaterials={materials}
      setAllMaterials={setMaterials}
      total={materialsTotal(materials)}
      onSavePrice={onSavePrice}
      materialNames={materialNames}
    />
  );
}

function row(partial: Partial<MaterialsType> & Pick<MaterialsType, "id">) {
  return { material: "", price: 0, units: 1, ...partial };
}

/**
 * `userEvent.setup()` installs its own `navigator.clipboard` stub, so the spy has
 * to be attached after it rather than before, or the component writes to
 * Testing Library's copy and the assertion never sees it.
 */
function setupUser() {
  const user = userEvent.setup();
  const writeText = vi
    .spyOn(navigator.clipboard, "writeText")
    .mockResolvedValue(undefined);
  return { user, writeText };
}

describe("editing a material name", () => {
  it("leaves the quantity alone when the name is edited", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[row({ id: "a", material: "screws", units: 6 })]} />);

    const quantity = screen.getByLabelText("Quantity for screws");
    expect(quantity).toHaveValue("6");

    await user.type(screen.getByLabelText("Material name"), " galvanised");

    // The bug: every keystroke re-read the name as "1 unit of <name>" and wrote
    // the quantity back as 1, wiping a quantity the user had set.
    expect(screen.getByLabelText(/^Quantity for/)).toHaveValue("6");
  });

  it("still reads an explicitly typed quantity prefix", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[row({ id: "a", material: "", units: 1 })]} />);

    await user.type(screen.getByLabelText("Material name"), "12x screws");

    expect(screen.getByLabelText(/^Quantity for/)).toHaveValue("12");
  });

  it("offers a catalogue name and keeps a typed quantity prefix", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={[row({ id: "a", material: "", units: 1 })]}
        materialNames={["white silicone", "screws"]}
      />,
    );

    await user.type(screen.getByLabelText("Material name"), "2x sil");
    await user.click(await screen.findByRole("option", { name: "white silicone" }));

    expect(screen.getByLabelText("Material name")).toHaveValue("2x white silicone");
    expect(screen.getByLabelText(/^Quantity for/)).toHaveValue("2");
  });
});

describe("merging a duplicate", () => {
  it("reports the merge, which the toast never used to do", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={[
          row({ id: "a", material: "screws", units: 2 }),
          row({ id: "b", material: "", units: 0 }),
        ]}
      />,
    );

    const fields = screen.getAllByLabelText("Material name");
    await user.type(fields[1], "screws");
    await user.tab();

    // Previously the result was read out of a state updater before React had run
    // it, so the message was always empty and no toast appeared.
    expect(
      await screen.findByText("screws already exists. Quantity increased."),
    ).toBeInTheDocument();
  });

  it("adds the duplicate's quantity rather than counting it as one", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={[
          row({ id: "a", material: "screws", units: 2 }),
          row({ id: "b", material: "", units: 0 }),
        ]}
      />,
    );

    const fields = screen.getAllByLabelText("Material name");
    await user.type(fields[1], "3x screws");
    await user.tab();

    await waitFor(() =>
      expect(screen.getByLabelText("Quantity for screws")).toHaveValue("5"),
    );
  });
});

describe("prices", () => {
  it("does not save a price the user never touched", async () => {
    const user = userEvent.setup();
    const onSavePrice = vi.fn();
    render(
      <Harness
        initial={[row({ id: "a", material: "screws", units: 1, price: 2 })]}
        onSavePrice={onSavePrice}
      />,
    );

    await user.click(screen.getByLabelText("Unit price for screws"));
    await user.tab();

    expect(onSavePrice).not.toHaveBeenCalled();
  });

  it("saves an edited price against the material name", async () => {
    const user = userEvent.setup();
    const onSavePrice = vi.fn();
    render(
      <Harness
        initial={[row({ id: "a", material: "screws", units: 1, price: 0 })]}
        onSavePrice={onSavePrice}
      />,
    );

    const price = screen.getByLabelText("Unit price for screws");
    await user.clear(price);
    await user.type(price, "2.5");
    await user.tab();

    // A number, not a string: the price is numeric from the input field all the
    // way to the stored column.
    expect(onSavePrice).toHaveBeenCalledWith("screws", 2.5);
  });

  it("shows the line total and the running total to the penny", () => {
    render(
      <Harness
        initial={[row({ id: "a", material: "screws", units: 3, price: 1.5 })]}
      />,
    );

    // The visually hidden "Line total for screws:" prefix is a child element, and
    // Testing Library matches only an element's own text nodes, so the line total
    // is queried as the bare amount.
    expect(screen.getByText("£4.50")).toBeInTheDocument();
    expect(screen.getByText("Total £4.50")).toBeInTheDocument();
  });
});

describe("copying", () => {
  it("copies the list in the order shown", async () => {
    const { user, writeText } = setupUser();
    render(
      <Harness
        initial={[
          row({ id: "a", material: "screws", units: 12 }),
          row({ id: "b", material: "blade", units: 1 }),
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Copy list" }));

    expect(writeText).toHaveBeenCalledWith("12x screws\n1x blade\n");
  });

  it("copies quantity, unit price and total when asked for prices", async () => {
    const { user, writeText } = setupUser();
    render(
      <Harness
        initial={[row({ id: "a", material: "screws", units: 2, price: 1.5 })]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Copy with price" }));

    const copied = writeText.mock.calls[0][0];
    expect(copied).toContain("2x screws");
    expect(copied).toContain("1.50 £");
    expect(copied).toContain("Total: 3.00 £");
  });

  it("says so when the browser refuses clipboard access", async () => {
    const { user, writeText } = setupUser();
    writeText.mockRejectedValueOnce(new Error("denied"));
    render(<Harness initial={[row({ id: "a", material: "screws", units: 1 })]} />);

    await user.click(screen.getByRole("button", { name: "Copy list" }));

    expect(await screen.findByText("Could not copy")).toBeInTheDocument();
  });
});

describe("column visibility", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("shows a Columns control and the desktop fields, not move-up buttons", () => {
    render(<Harness initial={[row({ id: "a", material: "screws", units: 1 })]} />);

    expect(screen.getByRole("button", { name: "Columns" })).toBeInTheDocument();
    expect(screen.getByLabelText("Material name")).toBeInTheDocument();
    expect(screen.getByLabelText("Quantity for screws")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Move .+ up/ }),
    ).not.toBeInTheDocument();
  });

  it("hides the quantity field when Quantity is unchecked, and keeps the name", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[row({ id: "a", material: "screws", units: 1 })]} />);

    await user.click(screen.getByRole("button", { name: "Columns" }));
    await user.click(screen.getByRole("menuitem", { name: "Quantity" }));

    expect(screen.queryByLabelText("Quantity for screws")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Material name")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Quantity" })).toBeInTheDocument();
  });

  it("honours a stored quantity-off preference on first render", () => {
    window.localStorage.setItem(
      MATERIALS_COLUMNS_KEY,
      JSON.stringify({ ...DEFAULT_COLUMN_VISIBILITY, quantity: false }),
    );
    render(<Harness initial={[row({ id: "a", material: "screws", units: 1 })]} />);

    expect(screen.queryByLabelText("Quantity for screws")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Material name")).toBeInTheDocument();
  });

  it("writes the toggled visibility to localStorage", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[row({ id: "a", material: "screws", units: 1 })]} />);

    await user.click(screen.getByRole("button", { name: "Columns" }));
    await user.click(screen.getByRole("menuitem", { name: "Quantity" }));

    expect(JSON.parse(window.localStorage.getItem(MATERIALS_COLUMNS_KEY)!)).toEqual(
      { ...DEFAULT_COLUMN_VISIBILITY, quantity: false },
    );
  });
});

describe("compact type on a narrow viewport", () => {
  function renderList() {
    render(
      <ThemeProvider theme={createAppTheme("light")}>
        <Harness
          initial={[row({ id: "a", material: "screws", units: 6, price: 1.5 })]}
        />
      </ThemeProvider>,
    );
  }

  it("keeps material fields at the desktop input size", () => {
    renderList();

    const compact = { fontSize: "0.875rem" };
    expect(screen.getByLabelText("Material name")).toHaveStyle(compact);
    expect(screen.getByLabelText("Quantity for screws")).toHaveStyle(compact);
    expect(screen.getByLabelText("Unit price for screws")).toHaveStyle(compact);
  });

  it("keeps the compact add icon instead of a labelled button", () => {
    renderList();

    expect(
      screen.getByRole("button", { name: "Add material" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Add material")).not.toBeInTheDocument();
  });
});
