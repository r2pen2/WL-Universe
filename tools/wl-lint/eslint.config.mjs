// WL house-rule lint (AGENTS.md). Run from the repo root with `npm run lint:wl`.
// Only WL rules run here; each site's CRA build keeps its own react-app lint.
import tsParser from "@typescript-eslint/parser";
import wl from "./plugin.mjs";

const rules = {
  "wl/contact-links": "error",
  "wl/no-contact-text": "error",
  "wl/wl-text": "error",
  "wl/wl-images": "error",
  "wl/wl-forms": "error",
};

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/build/**",
      // The synced web-legos copy: primitives are allowed there.
      "packages/*/client/src/libraries/**",
      // Internal apps, not public WL sites.
      "packages/wl-admin-portal/**",
      "packages/a-new-day-coaching-crm/**",
      "**/*.test.*",
      "**/setupTests.*",
      "**/reportWebVitals.*",
      "**/serviceWorker.*",
    ],
  },
  {
    files: ["packages/*/client/src/**/*.{js,jsx,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { wl },
    rules,
  },
  {
    files: ["packages/*/client/src/**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { wl },
    rules,
  },
];
