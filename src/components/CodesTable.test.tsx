// @vitest-environment jsdom
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CodesTable from "./CodesTable";
import { CodeType } from "../types";

/**
 * Covers saving a materials edit. A failed save used to be logged to the console
 * only, so a lost edit stayed on screen looking saved, and the value kept locally
 * differed from the trimmed value sent to the API.
 */

const updateCodeMaterials = vi.fn();

vi.mock("../api", () => ({
  updateCodeMaterials: (...args: unknown[]) => updateCodeMaterials(...args),
}));

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

function Harness({
  initial,
  onError,
}: {
  initial: CodeType[];
  onError?: (message: string) => void;
}) {
  const [data, setData] = useState(initial);

  return (
    <CodesTable
      data={data}
      setData={setData}
      page={0}
      count={data.length}
      serverPaged={false}
      onPageChange={() => {}}
      onError={onError}
    />
  );
}

beforeEach(() => {
  updateCodeMaterials.mockResolvedValue(undefined);
});

describe("saving a materials edit", () => {
  it("sends the edit to the API on blur", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[code({ _id: "a1", code: "P100" })]} />);

    await user.type(screen.getByLabelText("Materials for code P100"), "2x screws");
    await user.tab();

    await waitFor(() =>
      expect(updateCodeMaterials).toHaveBeenCalledWith("a1", "2x screws"),
    );
  });

  // Bug 7. The rejection used to go to console.error, so the edit stayed on screen
  // as though it had been stored.
  it("reports a failed save instead of swallowing it", async () => {
    const user = userEvent.setup();
    const onError = vi.fn();
    updateCodeMaterials.mockRejectedValue(new Error("Not authorised."));
    render(
      <Harness initial={[code({ _id: "a1", code: "P100" })]} onError={onError} />,
    );

    await user.type(screen.getByLabelText("Materials for code P100"), "2x screws");
    await user.tab();

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        "Could not save materials for P100: Not authorised.",
      ),
    );
  });

  // Bug 8. Local state kept the untrimmed text while the API got the trimmed one.
  it("sends the same trimmed value it keeps locally", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[code({ _id: "a1", code: "P100" })]} />);

    await user.type(
      screen.getByLabelText("Materials for code P100"),
      "  2x screws  ",
    );
    await user.tab();

    await waitFor(() => expect(updateCodeMaterials).toHaveBeenCalled());
    const [, sent] = updateCodeMaterials.mock.lastCall ?? [];
    expect(sent).toBe("2x screws");

    // The copy button reads from the stored row, so it proves what state kept.
    expect(
      screen.getByRole("button", { name: "Copy materials for P100" }),
    ).toBeEnabled();
  });

  it("does not call the API when the value has not changed", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={[code({ _id: "a1", code: "P100", materials: "2x screws" })]}
      />,
    );

    await user.click(screen.getByLabelText("Materials for code P100"));
    await user.tab();

    expect(updateCodeMaterials).not.toHaveBeenCalled();
  });

  it("treats a whitespace-only change as no change", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={[code({ _id: "a1", code: "P100", materials: "2x screws" })]}
      />,
    );

    const field = screen.getByLabelText("Materials for code P100");
    await user.type(field, "   ");
    await user.tab();

    expect(updateCodeMaterials).not.toHaveBeenCalled();
  });
});

describe("rendering", () => {
  it("flags a comment that needs checking as a warning chip", () => {
    render(
      <Harness
        initial={[code({ _id: "a1", code: "P100", comments: "check access" })]}
      />,
    );

    expect(screen.getByText("check access")).toBeInTheDocument();
  });

  it("disables copy for a code with no materials", () => {
    render(<Harness initial={[code({ _id: "a1", code: "P100" })]} />);

    expect(
      screen.getByRole("button", { name: "Copy materials for P100" }),
    ).toBeDisabled();
  });

  it("shows the empty state when there are no codes", () => {
    render(<Harness initial={[]} />);

    expect(
      screen.getByText("Upload a job file or wait for the latest codes."),
    ).toBeInTheDocument();
  });
});
