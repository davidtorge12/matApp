/**
 * Row identity for the materials list. Replaces the `uuid` package: these ids
 * never leave the browser tab, so the platform's own generator is enough and it
 * removes a dependency (and its advisory) from the bundle.
 */
export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // `randomUUID` needs a secure context. A plain-http origin still has to be
  // able to add a row, and a React key only has to be unique within the list.
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
