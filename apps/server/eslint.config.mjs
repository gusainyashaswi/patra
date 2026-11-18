import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      // The server currently uses explicit `any` at a few HTTP/model boundaries.
      // Keep lint enabled while those boundaries are migrated incrementally.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
