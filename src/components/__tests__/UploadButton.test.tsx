// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UploadButton from "../UploadButton";
import { CodeType } from "../../types";

/**
 * Covers the upload flow end to end with the spreadsheet reader and the API mocked.
 * Three of the bugs fixed in this area — a second upload being ignored, an
 * unreadable file wedging the page, and comments taken from the wrong sheet row —
 * were only reachable through this sequence of calls, not through any helper.
 */

const readSheetNames = vi.fn();
const readFile = vi.fn();
const upsertCodes = vi.fn();

vi.mock("read-excel-file", () => ({
  default: (...args: unknown[]) => readFile(...args),
  readSheetNames: (...args: unknown[]) => readSheetNames(...args),
}));

vi.mock("../../api", () => ({
  upsertCodes: (...args: unknown[]) => upsertCodes(...args),
}));

/** A minimal job sheet: a "Code" header row, then `count` code rows. */
function sheetWith(count: number, startAt = 1000) {
  const rows: unknown[][] = [["Code", "Description"]];
  for (let i = 0; i < count; i += 1) {
    rows.push([`P${startAt + i}`, `Description ${i}`]);
  }
  return rows;
}

function file(name = "job.xlsx") {
  return new File(["binary"], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function renderButton() {
  const onData = vi.fn();
  const onStart = vi.fn();
  const onError = vi.fn();
  const onAddress = vi.fn();

  render(
    <UploadButton
      onData={onData}
      onStart={onStart}
      onError={onError}
      onAddress={onAddress}
    />,
  );

  // The input is `hidden`, which excludes it from label queries.
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) {
    throw new Error("file input not rendered");
  }

  return { onData, onStart, onError, onAddress, input };
}

beforeEach(() => {
  readSheetNames.mockResolvedValue(["Sheet1"]);
  upsertCodes.mockImplementation(async (chunk: { code: string }[]) =>
    chunk.map((row) => ({
      _id: `id-${row.code}`,
      code: row.code,
      description: "",
      materials: "",
      createdAt: "",
      updatedAt: "",
    })),
  );
});

describe("uploading a job file", () => {
  it("parses the sheet and hands the saved codes back", async () => {
    const user = userEvent.setup();
    readFile.mockResolvedValue(sheetWith(2));
    const { onData, onStart, onError, input } = renderButton();

    await user.upload(input, file());

    await waitFor(() => expect(onData).toHaveBeenCalled());
    expect(onStart).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(onData.mock.lastCall?.[0].map((c: CodeType) => c.code)).toEqual([
      "P1000",
      "P1001",
    ]);
  });

  // Bug 4. The upload used to be triggered by an effect keyed on the number of
  // codes, so a second file with the same count left the effect unfired.
  it("loads a second file that happens to have the same number of codes", async () => {
    const user = userEvent.setup();
    readFile.mockResolvedValueOnce(sheetWith(2, 1000));
    const { onData, input } = renderButton();

    await user.upload(input, file("first.xlsx"));
    await waitFor(() => expect(onData).toHaveBeenCalledTimes(1));

    readFile.mockResolvedValueOnce(sheetWith(2, 2000));
    await user.upload(input, file("second.xlsx"));

    await waitFor(() => expect(onData).toHaveBeenCalledTimes(2));
    expect(onData.mock.lastCall?.[0].map((c: CodeType) => c.code)).toEqual([
      "P2000",
      "P2001",
    ]);
  });

  // Bug 5. The reads used to sit outside any try, so a rejection left the page on
  // skeletons with no message.
  it("reports an unreadable file instead of leaving the page loading", async () => {
    const user = userEvent.setup();
    readFile.mockRejectedValue(new Error("Cannot read this file"));
    const { onData, onError, input } = renderButton();

    await user.upload(input, file("broken.xlsx"));

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith("Cannot read this file"),
    );
    // Clearing the data is what takes the list off its skeletons.
    expect(onData).toHaveBeenCalledWith([]);
    expect(screen.getByRole("button", { name: /Upload/ })).toBeEnabled();
  });

  it("reports a sheet with no job codes in it", async () => {
    const user = userEvent.setup();
    readFile.mockResolvedValue([["Not", "A", "Job", "Sheet"]]);
    const { onData, onError, input } = renderButton();

    await user.upload(input, file());

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(expect.stringContaining("No job codes")),
    );
    expect(onData).toHaveBeenCalledWith([]);
    expect(upsertCodes).not.toHaveBeenCalled();
  });

  it("surfaces an API failure during upload", async () => {
    const user = userEvent.setup();
    readFile.mockResolvedValue(sheetWith(2));
    upsertCodes.mockRejectedValue(new Error("Could not reach the server."));
    const { onError, input } = renderButton();

    await user.upload(input, file());

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith("Could not reach the server."),
    );
  });

  it("posts long sheets in chunks of 50", async () => {
    const user = userEvent.setup();
    readFile.mockResolvedValue(sheetWith(120));
    const { onData, input } = renderButton();

    await user.upload(input, file());

    await waitFor(() => expect(onData).toHaveBeenCalled());
    expect(upsertCodes).toHaveBeenCalledTimes(3);
    expect(upsertCodes.mock.calls.map(([chunk]) => chunk.length)).toEqual([
      50, 50, 20,
    ]);
    expect(onData.mock.lastCall?.[0]).toHaveLength(120);
  });

  it("shows the file name and clears it on demand", async () => {
    const user = userEvent.setup();
    readFile.mockResolvedValue(sheetWith(1));
    const { onData, onAddress, input } = renderButton();

    await user.upload(input, file("void-42.xlsx"));
    expect(await screen.findByText("void-42.xlsx")).toBeInTheDocument();

    // MUI renders a Chip's delete affordance as an svg with a <title>, not a
    // button; the chip root itself is the button, and Backspace deletes.
    await user.click(screen.getByRole("img", { name: "Clear void-42.xlsx" }));

    expect(screen.queryByText("void-42.xlsx")).not.toBeInTheDocument();
    expect(onData).toHaveBeenLastCalledWith([]);
    expect(onAddress).toHaveBeenLastCalledWith("");
  });
});
