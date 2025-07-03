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
        "src/cli.ts",
        "src/lib/types.ts",
        "eslint.config.js",
        "vitest.config.ts",
        "semantic-release.config.mjs",
      ],
    },
  },
  esbuild: {
    target: "node18",
  },
});
