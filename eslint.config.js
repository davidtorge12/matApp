import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "coverage"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // An unused argument is often a deliberately ignored callback parameter;
      // a leading underscore marks that intent.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // A warning, not an error. The rule's advice — that an effect should not
      // set state synchronously — is aimed at effects that derive state, and the
      // ones left here fetch from the API, where flipping a loading flag before
      // the request is the point. Adopting a query library would remove them
      // outright; see docs/REVIEW.md.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    // Test files use the Vitest globals enabled in vite.config.ts.
    files: ["**/*.test.{ts,tsx}", "src/test/**"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
);
