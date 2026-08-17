/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    // Pure logic tests run in Node, which is much faster to start. Component
    // tests opt into a DOM with `// @vitest-environment jsdom` at the top of the
    // file.
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test/setup.ts"],
    // Testing Library registers its automatic unmount on the global `afterEach`,
    // so without this each rendered component leaks into the next test and
    // queries start finding two of everything.
    globals: true,
    restoreMocks: true,
  },
});
