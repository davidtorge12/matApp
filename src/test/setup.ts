import "@testing-library/jest-dom/vitest";

// Loaded for every test file, including the Node-environment ones, so anything
// touching the DOM has to be guarded.
if (typeof window !== "undefined") {
  // jsdom implements neither matchMedia (MUI's useMediaQuery) nor the async
  // clipboard, so both are stubbed to a predictable default: the wide layout, and
  // a clipboard that records what it was handed.
  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }
}
