import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".flowkit/**",
      "openspec/**",
      "architecture/**",
      "node_modules/**",
      "dist/**",
      "coverage/**",
      ".tmp/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    rules: {
      "max-lines": [
        "error",
        { max: 650, skipBlankLines: false, skipComments: false },
      ],
    },
  },
  {
    files: ["src/domain/run-result-persistence.ts"],
    rules: {
      "no-control-regex": "off",
    },
  },
  {
    files: ["tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
      ],
    },
  },
);
