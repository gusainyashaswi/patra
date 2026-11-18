import parser from "@typescript-eslint/parser";

export default [
  { ignores: ["dist/**", "node_modules/**"] },
  {
    files: ["src/**/*.ts"],
    languageOptions: { parser, parserOptions: { ecmaVersion: "latest", sourceType: "module" } },
    rules: { "no-debugger": "error", "no-dupe-keys": "error", "no-duplicate-case": "error", "no-unreachable": "error", "constructor-super": "error", "valid-typeof": "error" },
  },
];
