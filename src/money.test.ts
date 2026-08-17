import { describe, expect, it } from "vitest";
import { formatMoney, lineTotal, materialsTotal } from "./money";
import { MaterialsType } from "./types";

function row(price: number, units: number): MaterialsType {
  return { id: `${price}-${units}`, material: "m", price, units };
}

describe("formatMoney", () => {
  it("always shows two decimals", () => {
    expect(formatMoney(1.5)).toBe("£1.50");
    expect(formatMoney(12)).toBe("£12.00");
  });

  it("falls back to zero for a non-finite value", () => {
    expect(formatMoney(Number.NaN)).toBe("£0.00");
    expect(formatMoney(Number.POSITIVE_INFINITY)).toBe("£0.00");
  });
});

describe("lineTotal", () => {
  it("multiplies and rounds to pennies", () => {
    // 1.005 * 3 is 3.0149999… in binary floating point, so this rounds down.
    expect(lineTotal(1.005, 3)).toBe(3.01);
    expect(lineTotal(2.5, 4)).toBe(10);
    expect(lineTotal(0.1, 3)).toBe(0.3);
  });
});

describe("materialsTotal", () => {
  it("sums every line", () => {
    expect(materialsTotal([row(1.5, 2), row(0.25, 4)])).toBe(4);
  });

  it("rounds away float drift so the total matches the pennies shown", () => {
    expect(materialsTotal([row(0.1, 3), row(0.2, 3)])).toBe(0.9);
  });

  it("is zero for an empty list", () => {
    expect(materialsTotal([])).toBe(0);
  });
});
