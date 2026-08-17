/**
 * Hides text visually while leaving it available to screen readers. Used to
 * give compact controls a spoken name where there is no room for a visible
 * label.
 *
 * Sizes are written with explicit units on purpose: in MUI's `sx`, a bare
 * `width: 1` is shorthand for `100%`, which would make this span the full width
 * of the page and add horizontal scroll.
 */
export const visuallyHidden = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;
