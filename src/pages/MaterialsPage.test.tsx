// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MaterialsPage from "./MaterialsPage";
import { CodeType } from "../types";

/**
 * Smoke cover for the page's data flow: the two fetch effects, the aggregation
 * shared between the price lookup and the skeleton, and the derived total. The
 * API module is mocked, so nothing here touches the network.
 */

const getLatestCodes = vi.fn();
const getMaterialPrices = vi.fn();

vi.mock("../api", () => ({
  getLatestCodes: (...args: unknown[]) => getLatestCodes(...args),
  getMaterialPrices: (...args: unknown[]) => getMaterialPrices(...args),
  setMaterialPrice: vi.fn().mockResolvedValue(undefined),
  updateCodeMaterials: vi.fn().mockResolvedValue(undefined),
}));

// AppBarActions portals into an element the real AppBar renders, which this page
// does not include.
beforeEach(() => {
  const slot = document.createElement("div");
  slot.id = "app-bar-actions";
  document.body.append(slot);
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
});
