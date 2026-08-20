import { ReactNode, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

export const APP_BAR_ACTIONS_ID = "app-bar-actions";
export const APP_BAR_CHIP_ID = "app-bar-chip";

export default function AppBarActions({
  children,
  slotId = APP_BAR_ACTIONS_ID,
}: {
  children: ReactNode;
  slotId?: string;
}) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setSlot(document.getElementById(slotId));
  }, [slotId]);

  if (!slot) {
    return null;
  }

  return createPortal(children, slot);
}
