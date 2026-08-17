import { describe, expect, it } from "vitest";
import { buildCopyText } from "./copyText";
import { MaterialsType } from "./types";

function row(
  partial: Partial<MaterialsType> & Pick<MaterialsType, "material">,
): MaterialsType {
  return { id: partial.material, price: 0, units: 1, ...partial };
}

describe("buildCopyText", () => {
  it("lists quantity and name, one per line", () => {
    expect(
      buildCopyText([
        row({ material: "screws", units: 12 }),
        row({ material: "blade", units: 1 }),
      ]),
    ).toBe("12x screws\n1x blade\n");
  });

  it("prints the bare name when the quantity is zero", () => {
    expect(buildCopyText([row({ material: "screws", units: 0 })])).toBe("screws\n");
  });

  it("puts the address above the list", () => {
    expect(
      buildCopyText([row({ material: "screws", units: 2 })], {
        address: "Address: \n1 Example Street\n\n",
      }),
    ).toBe("Address: \n1 Example Street\n\n2x screws\n");
  });

  it("aligns prices and always shows two decimals", () => {
    expect(
      buildCopyText([row({ material: "screws", units: 2, price: 1.5 })], {
        withPrices: true,
      }),
    ).toBe(
      "2x screws.................................... 1.50 £ \n\nTotal: 3.00 £ \n",
    );
  });

  it("keeps the total line when the job comes to zero", () => {
    const text = buildCopyText([row({ material: "screws", units: 2, price: 0 })], {
      withPrices: true,
    });

    expect(text).toContain("Total: 0.00 £");
  });

  it("rounds the total to pennies rather than exposing float drift", () => {
    const text = buildCopyText(
      [
        row({ material: "a", units: 3, price: 0.1 }),
        row({ material: "b", units: 3, price: 0.2 }),
      ],
      { withPrices: true },
    );

    expect(text).toContain("Total: 0.90 £");
  });

  it("lets a long name push its price right instead of truncating", () => {
    const long = "a".repeat(60);
    const text = buildCopyText([row({ material: long, units: 1, price: 1 })], {
      withPrices: true,
    });

    expect(text).toContain(long);
    expect(text).toContain("1.00 £");
  });

  it("returns an empty string for an empty list", () => {
    expect(buildCopyText([])).toBe("");
  });
});
