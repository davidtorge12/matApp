import { describe, expect, it } from "vitest";
import { allJobFixtures, jobType4 } from "./fixtures/jobSheets";
import { parseJobSheet, pickSheetName } from "./parseJobFile";

describe("pickSheetName", () => {
  it("uses Auto Pop SPEC when that sheet exists", () => {
    expect(pickSheetName(["Cover", "Notes", "Auto Pop SPEC"])).toBe(
      "Auto Pop SPEC",
    );
  });

  it("uses the Price sheet when COPY is first", () => {
    expect(pickSheetName(["COPY", "Void Price", "Other"])).toBe("Void Price");
  });

  it("falls back to the first sheet", () => {
    expect(pickSheetName(["Job"])).toBe("Job");
  });
});

describe("parseJobSheet", () => {
  it.each(allJobFixtures)("$name", (fixture) => {
    const result = parseJobSheet(fixture.sheets, fixture.rows);
    expect(result.address).toBe(fixture.expectedAddress);
    expect(result.rows).toEqual(fixture.expected);
  });

  it("keeps consecutive Auto Pop SPEC codes when the regex is reused", () => {
    const result = parseJobSheet(jobType4.sheets, jobType4.rows);
    expect(result.rows.map((row) => row.code)).toEqual(["330013", "373007"]);
  });

  it("skips header-like rows and values that are not codes", () => {
    const result = parseJobSheet(
      ["Job"],
      [
        ["Code", "Description"],
        ["TOTAL", "not a code"],
        ["396001", "Gain access"],
      ],
    );
    expect(result.rows).toEqual([
      { code: "396001", description: "Gain access", comments: "" },
    ]);
  });
});
