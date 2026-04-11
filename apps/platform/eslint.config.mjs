import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Theme safety rules — forbid hardcoded Tailwind light/dark colours in
 * JSX/TSX so that light mode and dark mode both render consistently.
 *
 * Allowed: semantic tokens like `bg-card`, `bg-background`,
 * `text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`,
 * `bg-primary`, `text-primary-foreground` — these automatically flip
 * between light and dark.
 *
 * Forbidden: `bg-gray-900`, `text-white`, `bg-black`, `bg-gray-800`, etc
 * unless prefixed with `dark:` (which explicitly scopes to dark mode).
 */
const HARDCODED_COLOUR_PATTERN =
  // Match className strings containing bg-/text-/border- with
  // gray/slate/zinc/neutral/stone 800+, pure black, or pure white,
  // that are NOT prefixed with `dark:`
  /className\s*=\s*["'`][^"'`]*(?:^|[\s"'`])(?:bg|text|border|fill|ring|divide|placeholder|decoration|outline|shadow|accent|caret)-(?:gray|slate|zinc|neutral|stone)-(?:8|9)00[^"'`]*["'`]|className\s*=\s*["'`][^"'`]*(?:^|[\s"'`])(?:bg|text|border)-(?:white|black)[^"'`]*["'`]/;

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
  // Theme safety rule — warns on hardcoded colours in JSX/TSX
  {
    files: ["src/**/*.{tsx,jsx}"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/\\b(?:bg|text|border)-(?:gray|slate|zinc|neutral|stone)-(?:8|9)00\\b(?!.*dark:)/]",
          message:
            "Hardcoded dark Tailwind colour detected. Use semantic tokens (bg-card, bg-background, text-foreground, text-muted-foreground, border-border) or prefix with dark: for explicit dark-mode scoping.",
        },
        {
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/\\b(?:bg|text)-(?:white|black)\\b(?!.*dark:)/]",
          message:
            "Hardcoded white/black colour detected. Use bg-background/text-foreground/bg-card instead, or prefix with dark: for dark-mode scoping.",
        },
      ],
    },
  },
]);

export default eslintConfig;
