import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default tseslint.config(
  {
    ignores: [
      "dist",
      // Generated Convex codegen output and the platform-owned dev toolbar:
      // not maintained in this repo, and the React-compiler lint rules
      // misreport patterns inside them.
      "src/convex/_generated/**",
      "vly-toolbar-readonly.tsx",
    ],
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      eslintConfigPrettier,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
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
    },
  },
  {
    // Vendored shadcn/ui components conventionally export a component plus
    // its variants helper from one file, and the router entry (main.tsx) is
    // never a fast-refresh target. This platform also runs with HMR
    // disabled, so the rule is advisory only — silence it for those files.
    files: ["src/components/ui/**", "src/main.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
);
