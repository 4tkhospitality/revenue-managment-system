import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // i18n: Warn on hardcoded Vietnamese strings in TSX files
  {
    files: ["**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "JSXText",
          message:
            "[i18n] Hardcoded text detected in JSX. Use t() from next-intl instead. See BRIEF-i18n.md §3.1",
        },
      ],
    },
  },
]);

export default eslintConfig;
