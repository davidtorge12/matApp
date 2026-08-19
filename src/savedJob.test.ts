import { describe, expect, it } from "vitest";
import { CodeType, MaterialsType } from "./types";
import {
  jobIdentity,
  jobLabel,
  parseSavedJob,
  parseSavedJobs,
  upsertSavedJob,
} from "./savedJob";

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

function material(
  partial: Partial<MaterialsType> & Pick<MaterialsType, "id">,
): MaterialsType {
  return { material: "", price: 0, units: 1, ...partial };
}

const job = {
  id: "job-1",
  fileName: "12-test-street.xlsx",
  address: "Address: \n12 Test Street\n\n",
  savedAt: "2026-08-19T12:00:00.000Z",
  codes: [code({ _id: "c1", code: "P100", materials: "2x screws" })],
  materials: [material({ id: "m1", material: "screws", units: 2, price: 1.5 })],
};

describe("parseSavedJob", () => {
  it("reads a complete job", () => {
    expect(parseSavedJob(job)).toEqual(job);
  });

  it("returns null for junk", () => {
    expect(parseSavedJob(null)).toBeNull();
    expect(parseSavedJob("job")).toBeNull();
    expect(parseSavedJob({ ...job, codes: "nope" })).toBeNull();
    expect(parseSavedJob({ ...job, materials: "nope" })).toBeNull();
  });

  it("drops a material row that has no name and no quantity", () => {
    const parsed = parseSavedJob({
      ...job,
      materials: [
        { id: "keep", material: "screws", price: 1, units: 2 },
        { id: "drop", material: "  ", price: 0, units: 0 },
      ],
    });
    expect(parsed?.materials).toEqual([
      { id: "keep", material: "screws", price: 1, units: 2 },
    ]);
  });
});

describe("parseSavedJobs", () => {
  it("keeps only valid jobs, in order", () => {
    expect(parseSavedJobs([job, { fileName: "bad" }, job])).toEqual([job, job]);
  });

  it("returns nothing for a non-array", () => {
    expect(parseSavedJobs(job)).toEqual([]);
  });
});

describe("upsertSavedJob", () => {
  it("puts a new job at the front", () => {
    const newer = { ...job, id: "job-2", fileName: "other.xlsx" };
    expect(upsertSavedJob([job], newer).map((row) => row.id)).toEqual([
      "job-2",
      "job-1",
    ]);
  });

  it("replaces a job with the same file and address rather than duplicating it", () => {
    const updated = {
      ...job,
      id: "job-1b",
      materials: [material({ id: "m2", material: "tape", units: 1 })],
    };
    const next = upsertSavedJob([job], updated);
    expect(next).toHaveLength(1);
    expect(next[0]?.materials[0]?.material).toBe("tape");
  });

  it("drops the oldest once the list is full", () => {
    const many = Array.from({ length: 5 }, (_, i) => ({
      ...job,
      id: `job-${i}`,
      fileName: `job-${i}.xlsx`,
    }));
    const extra = { ...job, id: "job-new", fileName: "new.xlsx" };
    expect(upsertSavedJob(many, extra).map((row) => row.id)).toEqual([
      "job-new",
      "job-0",
      "job-1",
      "job-2",
      "job-3",
    ]);
  });
});

describe("jobIdentity", () => {
  it("treats the same file and address as one job", () => {
    const otherId = { ...job, id: "other" };
    expect(jobIdentity(job)).toBe(jobIdentity(otherId));
    expect(jobIdentity(job)).not.toBe(
      jobIdentity({ ...job, fileName: "other.xlsx" }),
    );
  });
});

describe("jobLabel", () => {
  it("prefers the site address over the file name", () => {
    expect(jobLabel(job)).toBe("12 Test Street");
  });

  it("falls back to the file name", () => {
    expect(jobLabel({ ...job, address: "" })).toBe("12-test-street.xlsx");
  });
});
