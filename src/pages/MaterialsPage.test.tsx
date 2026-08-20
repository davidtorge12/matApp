// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MaterialsPage from "./MaterialsPage";
import { writeSavedJobs } from "../savedJob";
import { CodeType } from "../types";

/**
 * Smoke cover for the page's data flow: the two fetch effects, the aggregation
 * shared between the price lookup and the skeleton, and the derived total. The
 * API module is mocked, so nothing here touches the network.
 */

const getLatestCodes = vi.fn();
const getMaterialPrices = vi.fn();
const getMaterialNames = vi.fn();

vi.mock("../api", () => ({
  getLatestCodes: (...args: unknown[]) => getLatestCodes(...args),
  getMaterialPrices: (...args: unknown[]) => getMaterialPrices(...args),
  getMaterialNames: (...args: unknown[]) => getMaterialNames(...args),
  setMaterialPrice: vi.fn().mockResolvedValue(undefined),
  updateCodeMaterials: vi.fn().mockResolvedValue(undefined),
}));

// AppBarActions portals into elements the real AppBar renders, which this page
// does not include.
beforeEach(() => {
  window.localStorage.clear();
  getMaterialNames.mockResolvedValue({ items: [] });
  const actions = document.createElement("div");
  actions.id = "app-bar-actions";
  document.body.append(actions);
  const chip = document.createElement("div");
  chip.id = "app-bar-chip";
  document.body.append(chip);
});

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

describe("MaterialsPage", () => {
  it("aggregates materials across codes and totals them at the fetched prices", async () => {
    getLatestCodes.mockResolvedValue({
      items: [
        code({ _id: "1", code: "P100", materials: "2x screws; 1x blade" }),
        code({ _id: "2", code: "P200", materials: "3x screws" }),
      ],
      total: 2,
      page: 1,
      pageSize: 20,
    });
    getMaterialPrices.mockResolvedValue({ screws: "1.50", blade: "4" });

    render(<MaterialsPage />);

    // screws: 2 + 3 = 5 at £1.50, blade: 1 at £4.00 → £11.50
    expect(await screen.findByText("Total £11.50")).toBeInTheDocument();
    expect(screen.getByLabelText("Quantity for screws")).toHaveValue("5");
    expect(screen.getByText("P100")).toBeInTheDocument();
  });

  it("shows a failed codes fetch instead of loading forever", async () => {
    getLatestCodes.mockRejectedValue(new Error("Could not reach the server."));
    getMaterialPrices.mockResolvedValue({});

    render(<MaterialsPage />);

    expect(
      await screen.findByText("Could not reach the server."),
    ).toBeInTheDocument();
  });

  it("stops loading when the page's codes carry no materials at all", async () => {
    getLatestCodes.mockResolvedValue({
      items: [code({ _id: "1", code: "P100", materials: "" })],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    getMaterialPrices.mockResolvedValue({});

    render(<MaterialsPage />);

    // Previously this left the list on skeletons permanently, because the effect
    // returned early without clearing the loading flag.
    expect(
      await screen.findByText(
        "No materials on this page. Upload a job file or add one below.",
      ),
    ).toBeInTheDocument();
    expect(getMaterialPrices).not.toHaveBeenCalled();
  });

  it("restores the last saved job instead of fetching latest codes", async () => {
    writeSavedJobs([
      {
        id: "job-1",
        fileName: "12-test-street.xlsx",
        address: "Address: \n12 Test Street\n\n",
        savedAt: "2026-08-19T12:00:00.000Z",
        codes: [
          code({
            _id: "1",
            code: "P100",
            description: "Paint walls",
            materials: "2x screws",
          }),
        ],
        materials: [
          { id: "m1", material: "screws", units: 2, price: 1.5 },
          { id: "m2", material: "tape", units: 1, price: 0 },
        ],
      },
    ]);

    render(<MaterialsPage />);

    expect(await screen.findByText("P100")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Clear 12 Test Street" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Quantity for screws")).toHaveValue("2");
    expect(screen.getByLabelText("Quantity for tape")).toHaveValue("1");
    expect(getLatestCodes).not.toHaveBeenCalled();
    expect(getMaterialPrices).not.toHaveBeenCalled();
  });

  it("keeps an extra material after a remount", async () => {
    const user = userEvent.setup();
    writeSavedJobs([
      {
        id: "job-1",
        fileName: "job.xlsx",
        address: "",
        savedAt: "2026-08-19T12:00:00.000Z",
        codes: [code({ _id: "1", code: "P100", materials: "2x screws" })],
        materials: [{ id: "m1", material: "screws", units: 2, price: 1.5 }],
      },
    ]);

    const { unmount } = render(<MaterialsPage />);
    await screen.findByLabelText("Quantity for screws");
    await user.click(screen.getByRole("button", { name: "Add material" }));
    const names = screen.getAllByLabelText("Material name");
    await user.type(names[names.length - 1], "tape");
    unmount();

    render(<MaterialsPage />);

    expect(await screen.findByLabelText("Quantity for tape")).toHaveValue("0");
    expect(getLatestCodes).not.toHaveBeenCalled();
  });

  it("opens another saved job from Recent jobs", async () => {
    const user = userEvent.setup();
    writeSavedJobs([
      {
        id: "job-1",
        fileName: "first.xlsx",
        address: "Address: \n12 Test Street\n\n",
        savedAt: "2026-08-19T12:00:00.000Z",
        codes: [code({ _id: "1", code: "P100", materials: "2x screws" })],
        materials: [{ id: "m1", material: "screws", units: 2, price: 1.5 }],
      },
      {
        id: "job-2",
        fileName: "second.xlsx",
        address: "Address: \n8 Park Lane\n\n",
        savedAt: "2026-08-18T12:00:00.000Z",
        codes: [code({ _id: "2", code: "P200", description: "Renew deadlock" })],
        materials: [{ id: "m2", material: "blade", units: 1, price: 4 }],
      },
    ]);

    render(<MaterialsPage />);
    expect(await screen.findByText("P100")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Recent jobs" }));
    await user.click(screen.getByRole("menuitem", { name: /8 Park Lane/ }));

    expect(await screen.findByText("P200")).toBeInTheDocument();
    expect(screen.queryByText("P100")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Quantity for blade")).toHaveValue("1");
    expect(
      screen.getByRole("img", { name: "Clear 8 Park Lane" }),
    ).toBeInTheDocument();
  });

  it("clears the job chip from below the bar", async () => {
    const user = userEvent.setup();
    getLatestCodes.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
    writeSavedJobs([
      {
        id: "job-1",
        fileName: "first.xlsx",
        address: "Address: \n12 Test Street\n\n",
        savedAt: "2026-08-19T12:00:00.000Z",
        codes: [code({ _id: "1", code: "P100", materials: "2x screws" })],
        materials: [{ id: "m1", material: "screws", units: 2, price: 1.5 }],
      },
    ]);

    render(<MaterialsPage />);
    expect(
      await screen.findByRole("img", { name: "Clear 12 Test Street" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("img", { name: "Clear 12 Test Street" }));

    expect(
      screen.queryByRole("img", { name: "Clear 12 Test Street" }),
    ).not.toBeInTheDocument();
  });
});
