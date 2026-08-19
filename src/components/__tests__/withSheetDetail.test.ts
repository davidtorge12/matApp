import { describe, expect, it } from "vitest";
import { withSheetDetail } from "../UploadButton";
import { JobRow } from "../../parseJobFile";
import { CodeType } from "../../types";

function saved(code: string, description = ""): CodeType {
  return {
    _id: `id-${code}`,
    code,
    description,
    materials: "",
    createdAt: "",
    updatedAt: "",
  };
}

function jobRow(code: string, description = "", comments = ""): JobRow {
  return { code, description, comments };
}

describe("withSheetDetail", () => {
  it("attaches the sheet's description and comments", () => {
    expect(
      withSheetDetail(
        [saved("P100", "stored description")],
        [jobRow("P100", "sheet description", "check access")],
      ),
    ).toEqual([
      {
        ...saved("P100"),
        description: "sheet description",
        comments: "check access",
      },
    ]);
  });

  it("keeps the stored description when the sheet cell is blank", () => {
    const [result] = withSheetDetail(
      [saved("P100", "stored description")],
      [jobRow("P100", "", "note")],
    );

    expect(result.description).toBe("stored description");
  });

  it("takes the first row for a code the sheet lists twice", () => {
    const [result] = withSheetDetail(
      [saved("P100")],
      [
        jobRow("P100", "first", "first comment"),
        jobRow("P100", "second", "second"),
      ],
    );

    // The previous version scanned the whole sheet per code and kept whatever it
    // saw last, so a repeated code showed another line's comments.
    expect(result.comments).toBe("first comment");
    expect(result.description).toBe("first");
  });

  it("leaves comments empty for a code the sheet does not mention", () => {
    const [result] = withSheetDetail([saved("P999", "stored")], [jobRow("P100")]);

    expect(result.comments).toBe("");
    expect(result.description).toBe("stored");
  });

  it("handles an empty sheet without throwing", () => {
    expect(withSheetDetail([saved("P100", "stored")], [])).toEqual([
      { ...saved("P100", "stored"), comments: "" },
    ]);
  });
});
