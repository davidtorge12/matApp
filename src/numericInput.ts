/**
 * Helpers for numeric text fields.
 *
 * `<input type="number">` cannot hold a partially typed decimal: per spec its
 * `value` reads back as "" whenever the text is not a valid floating point
 * number, so "1." arrives as "" and a controlled field snaps to 0 before the
 * user can type the fraction digits. These helpers back a plain text input with
 * `inputMode="decimal"` instead, keeping the typed draft intact while the model
 * follows along numerically.
 */

/** Strips anything that cannot appear in a positive decimal, keeping one dot. */
export function sanitizeNumericInput(raw: string): string {
  const digitsAndDots = raw.replace(/[^\d.]/g, "");
  const firstDot = digitsAndDots.indexOf(".");
  if (firstDot === -1) {
    return digitsAndDots;
  }

  const whole = digitsAndDots.slice(0, firstDot);
  const fraction = digitsAndDots.slice(firstDot + 1).replace(/\./g, "");
  return `${whole}.${fraction}`;
}

/** Reads a draft string as a number, treating incomplete input as 0. */
export function parseNumericInput(raw: string): number {
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Renders a model number back into editable text. */
export function formatNumericInput(value: number): string {
  return Number.isFinite(value) ? String(value) : "0";
}
