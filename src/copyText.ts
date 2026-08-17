import { CURRENCY, materialsTotal } from "./money";
import { MaterialsType } from "./types";

/** Column the price is aligned to, so a pasted list reads as two columns. */
const NAME_WIDTH = 45;

export type CopyOptions = {
  /** Free text placed above the list, newline-terminated by the caller. */
  address?: string;
  /** Adds a unit price per row and a grand total. */
  withPrices?: boolean;
};

/** Money in the pasted list: trailing currency, always two decimals. */
function amount(value: number): string {
  return `${(Number.isFinite(value) ? value : 0).toFixed(2)} ${CURRENCY}`;
}

/**
 * Renders the materials list as the plain text the firm pastes into their own
 * system. The column layout is deliberately unchanged from the original.
 *
 * Replaces a version that took four parallel arrays (`materials`, `units`,
 * `prices`) and indexed across them, which produced `undefined` in the price
 * column whenever they fell out of step. Two output bugs are fixed with it: the
 * grand total printed unrounded, so a £12.50 job copied as "12.5", and the total
 * line was dropped entirely whenever it came to zero.
 */
export function buildCopyText(
  materials: MaterialsType[],
  { address, withPrices = false }: CopyOptions = {},
): string {
  let out = address ?? "";

  for (const { material, units, price } of materials) {
    // A quantity of 0 prints the bare name, matching the previous behaviour.
    const name = units ? `${units}x ${material}` : material;

    // padEnd only ever pads, so a long name pushes its price right rather than
    // being cut off.
    out += withPrices
      ? `${name.padEnd(NAME_WIDTH, ".")} ${amount(price)} \n`
      : `${name}\n`;
  }

  if (withPrices) {
    out += `\nTotal: ${amount(materialsTotal(materials))} \n`;
  }

  return out;
}
