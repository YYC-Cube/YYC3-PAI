/**
 * @file eslint.config.mjs
 * @description YYC3 AI Code ESLint flat config (v10+)
 * @version 4.8.1
 */
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  // Global ignores
  { ignores: ["dist/", "node_modules/", "*.config.*", "coverage/", "playwright-report/"] },

  // Base JS rules
  js.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // React Hooks
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // React Refresh (Vite HMR)
  {
    plugins: { "react-refresh": reactRefresh },
    rules: {
      "react-refresh/only-export-components": ["warn", {
        allowConstantExport: true,
        allowExportNames: [
          "useI18n",
          "cyberToast",
          "PerformanceMonitorProps",
          "withPerformanceTracking",
          "createPerformanceMonitoredComponent",
          "filterFileTree",
          "IDELayoutContextValue",
          "IDELayoutProvider",
          "useIDELayout",
          "badgeVariants",
          "buttonVariants",
          "toggleVariants",
          "navigationMenuTriggerStyle",
          "useFormField",
          "useSidebar",
          "AIModel",
          "ConnectivityStatus",
          "ModelTestResult",
          "ModelStoreProvider",
          "useModelStore",
        ],
      }],
    },
  },

  // Project-specific overrides
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // Relax rules for rapid prototyping — tighten progressively
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "warn",
    },
  },

  // Logger utility - allow all console methods
  {
    files: ["src/app/utils/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },

  // Performance benchmark tools - allow console for reporting
  {
    files: ["src/app/services/monaco-performance-benchmark.ts"],
    rules: {
      "no-console": "off",
    },
  },

  // Version examples - contains reference console output patterns
  {
    files: ["src/utils/version-examples.ts"],
    rules: {
      "no-console": "off",
    },
  },

  // Test file overrides
  {
    files: ["src/**/*.test.{ts,tsx}", "src/**/__tests__/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },

  // Prettier compat (must be last)
  prettier,
);
