import { MaterialsType } from "./types";

export const CURRENCY = "£";

/**
 * Single place money becomes text. Previously `£${n.toFixed(2)}` was written out
 * in three components while the copied list printed raw numbers, so the same
 * total could read "12.5" on the clipboard and "£12.50" on screen.
 */
export function formatMoney(value: number): string {
  return `${CURRENCY}${(Number.isFinite(value) ? value : 0).toFixed(2)}`;
}

/** Rounded to pennies, so a long list of line totals still sums to the total shown. */
export function lineTotal(price: number, units: number): number {
  return round(price * units);
}

export function materialsTotal(materials: MaterialsType[]): number {
  return round(materials.reduce((sum, { price, units }) => sum + price * units, 0));
}

function round(value: number): number {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
}
