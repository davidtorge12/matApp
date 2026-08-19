import { describe, expect, it } from "vitest";
import { CodeType } from "./types";
import { filterJobCodes, needsMaterialsCount } from "./filterJobCodes";

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

const rows = [
  code({
    _id: "1",
    code: "P100",
    description: "Paint walls",
    comments: "use spare keys",
    materials: "2x emulsion",
  }),
  code({
    _id: "2",
    code: "P200",
    description: "Renew deadlock",
    comments: "check access",
  }),
  code({
    _id: "3",
    code: "390915",
    description: "Strip wallpaper",
    materials: "1x scraper",
  }),
];

describe("filterJobCodes", () => {
  it("returns every row when there is no query and the queue is off", () => {
    expect(filterJobCodes(rows, { query: "", needsMaterials: false })).toEqual(
      rows,
    );
  });

  it("matches a code, description or comment, ignoring case", () => {
    expect(filterJobCodes(rows, { query: "p100" }).map((row) => row.code)).toEqual([
      "P100",
    ]);
    expect(
      filterJobCodes(rows, { query: "DEADLOCK" }).map((row) => row.code),
    ).toEqual(["P200"]);
    expect(filterJobCodes(rows, { query: "spare" }).map((row) => row.code)).toEqual(
      ["P100"],
    );
  });

  it("does not search the materials text", () => {
    expect(filterJobCodes(rows, { query: "emulsion" })).toEqual([]);
  });

  it("trims the query", () => {
    expect(
      filterJobCodes(rows, { query: "  wallpaper  " }).map((row) => row.code),
    ).toEqual(["390915"]);
  });

  it("keeps only rows with empty materials when the queue is on", () => {
    expect(
      filterJobCodes(rows, { needsMaterials: true }).map((row) => row.code),
    ).toEqual(["P200"]);
  });

  it("treats whitespace-only materials as empty", () => {
    const withBlank = [
      code({ _id: "a", code: "A1", materials: "   " }),
      code({ _id: "b", code: "B1", materials: "1x screw" }),
    ];
    expect(
      filterJobCodes(withBlank, { needsMaterials: true }).map((row) => row.code),
    ).toEqual(["A1"]);
  });

  it("combines the search with the empty-materials queue", () => {
    expect(
      filterJobCodes(rows, { query: "P", needsMaterials: true }).map(
        (row) => row.code,
      ),
    ).toEqual(["P200"]);
  });
});

describe("needsMaterialsCount", () => {
  it("counts rows that still have no materials", () => {
    expect(needsMaterialsCount(rows)).toBe(1);
  });
});
