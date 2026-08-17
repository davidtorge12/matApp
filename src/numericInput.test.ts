import { describe, expect, it } from "vitest";
import {
  formatNumericInput,
  parseNumericInput,
  sanitizeNumericInput,
} from "./numericInput";

describe("sanitizeNumericInput", () => {
  it("keeps a partially typed decimal so the fraction can still be typed", () => {
    expect(sanitizeNumericInput("1.")).toBe("1.");
    expect(sanitizeNumericInput("0.")).toBe("0.");
  });

  it("keeps complete decimals", () => {
    expect(sanitizeNumericInput("12.50")).toBe("12.50");
    expect(sanitizeNumericInput(".5")).toBe(".5");
  });

  it("collapses extra dots", () => {
    expect(sanitizeNumericInput("1.2.3")).toBe("1.23");
    expect(sanitizeNumericInput("..")).toBe(".");
  });

  it("drops characters that cannot appear in a positive decimal", () => {
    expect(sanitizeNumericInput("12abc")).toBe("12");
    expect(sanitizeNumericInput("£12.50")).toBe("12.50");
    expect(sanitizeNumericInput("-3")).toBe("3");
    expect(sanitizeNumericInput("1e5")).toBe("15");
  });

  it("allows an empty field", () => {
    expect(sanitizeNumericInput("")).toBe("");
    expect(sanitizeNumericInput("abc")).toBe("");
  });
});

describe("parseNumericInput", () => {
  it("reads complete numbers", () => {
    expect(parseNumericInput("12.5")).toBe(12.5);
    expect(parseNumericInput("0.5")).toBe(0.5);
    expect(parseNumericInput(".5")).toBe(0.5);
  });

  it("treats incomplete or empty input as 0", () => {
    expect(parseNumericInput("")).toBe(0);
    expect(parseNumericInput(".")).toBe(0);
    expect(parseNumericInput("1.")).toBe(1);
  });
});

describe("formatNumericInput", () => {
  it("renders model numbers as editable text", () => {
    expect(formatNumericInput(0)).toBe("0");
    expect(formatNumericInput(12.5)).toBe("12.5");
  });

  it("falls back to 0 for non-finite values", () => {
    expect(formatNumericInput(NaN)).toBe("0");
    expect(formatNumericInput(Infinity)).toBe("0");
  });
});

describe("typing a decimal price end to end", () => {
  it("survives the keystroke sequence that type=number loses", () => {
    // Reproduces "1" -> "1." -> "1.5": the middle keystroke used to reset to 0.
    const keystrokes = ["1", "1.", "1.5"];
    const drafts = keystrokes.map(sanitizeNumericInput);

    expect(drafts).toEqual(["1", "1.", "1.5"]);
    expect(drafts.map(parseNumericInput)).toEqual([1, 1, 1.5]);
  });
});
