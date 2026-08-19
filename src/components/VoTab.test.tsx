// @vitest-environment jsdom
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import VoTab from "./VoTab";

function Harness({
  initial,
  onGetCodes = () => {},
}: {
  initial: string;
  onGetCodes?: () => void;
}) {
  const [vo, setVo] = useState(initial);
  return <VoTab vo={vo} error="" onChange={setVo} onGetCodes={onGetCodes} />;
}

describe("VoTab serialize", () => {
  it("trims rows and adds a single x marker on Serialize", async () => {
    const user = userEvent.setup();
    render(<Harness initial={"  renew Bath panel  \nx  Bonding coat"} />);

    await user.click(screen.getByRole("button", { name: "Serialize" }));

    expect(screen.getByLabelText("VO lines")).toHaveValue(
      "x renew Bath panel\nx Bonding coat",
    );
  });

  it("puts Copy VO in the card header as an icon button", () => {
    render(<Harness initial="x renew Bath panel" />);

    expect(screen.getByRole("button", { name: "Copy VO" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy VO" })).not.toHaveTextContent(
      "Copy VO",
    );
  });

  it("serializes before Match codes", async () => {
    const user = userEvent.setup();
    const onGetCodes = vi.fn();
    render(
      <Harness
        initial={"  renew Bath panel  \n Bonding coat"}
        onGetCodes={onGetCodes}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Match codes" }));

    expect(screen.getByLabelText("VO lines")).toHaveValue(
      "x renew Bath panel\nx Bonding coat",
    );
    expect(onGetCodes).toHaveBeenCalledOnce();
  });

  it("fills the sample VO lines from Use sample", async () => {
    const user = userEvent.setup();
    render(<Harness initial="" />);

    await user.click(screen.getByRole("button", { name: "Use sample" }));

    expect(screen.getByLabelText("VO lines")).toHaveValue(
      "renew Bath panel\nBonding coat in patch\nBonding coat & Skimming",
    );
  });
});
