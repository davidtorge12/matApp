import { ReactNode, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

export const APP_BAR_ACTIONS_ID = "app-bar-actions";

export default function AppBarActions({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setSlot(document.getElementById(APP_BAR_ACTIONS_ID));
  }, []);

  if (!slot) {
    return null;
  }

  return createPortal(children, slot);
}
