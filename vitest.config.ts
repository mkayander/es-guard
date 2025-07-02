import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["node_modules", "dist"],
  },
  esbuild: {
    target: "node18",
  },
});
