import { describe, test, expect } from "vitest";

describe("ES-Guard Basic Tests", () => {
  test("should be able to import modules", async () => {
    // Test that all modules can be imported without errors
    await expect(import("../lib/types.js")).resolves.toBeDefined();
    await expect(import("../lib/validateConfig.js")).resolves.toBeDefined();
    await expect(import("../lib/createESLintConfig.js")).resolves.toBeDefined();
  });

  test("should have proper exports", async () => {
    const { checkCompatibility } = await import("../lib/checkCompatiblity.js");
    expect(typeof checkCompatibility).toBe("function");
  });
});
