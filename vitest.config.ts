import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["node_modules", "dist"],
    coverage: {
      reporter: ["text", "lcov"],
      exclude: [
        "**/__tests__/**",
        "dist/**",
        "examples/**",
        "src/cli.ts",
        "src/lib/types.ts",
        "eslint.config.js",
        "vitest.config.ts",
        "release.config.mjs",
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        "./src/lib/": {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
  },
  esbuild: {
    target: "node18",
  },
});
