import * as fs from "fs";
import * as path from "path";
import { describe, expect, test } from "vitest";

describe("Programmatic API", () => {
  test("should export all main functions", async () => {
    const api = await import("../index.js");

    // Core functions
    expect(typeof api.checkCompatibility).toBe("function");
    expect(typeof api.formatViolationMessage).toBe("function");

    // Detection functions
    expect(typeof api.detectProjectConfig).toBe("function");
    expect(typeof api.detectTarget).toBe("function");
    expect(typeof api.detectOutputDir).toBe("function");
    expect(typeof api.detectBrowserslist).toBe("function");

    // Utility functions
    expect(typeof api.getBrowserTargetsFromString).toBe("function");
    expect(typeof api.getBrowserTargets).toBe("function");
    expect(typeof api.parseEcmaVersion).toBe("function");
    expect(typeof api.validateConfig).toBe("function");
    expect(typeof api.getCurrentProjectType).toBe("function");

    // Global state functions
    expect(typeof api.setVerboseMode).toBe("function");
    expect(typeof api.setDebugMode).toBe("function");
    expect(typeof api.getGlobalState).toBe("function");
    expect(typeof api.setGlobalState).toBe("function");
  });

  test("should export all types", async () => {
    const api = await import("../index.js");

    // TypeScript types are erased at runtime, so we can't test them directly
    // Instead, we verify that the module exports are working correctly
    expect(typeof api).toBe("object");
    expect(api).toBeDefined();
  });

  test("should work with basic compatibility check", async () => {
    const { checkCompatibility } = await import("../index.js");

    // Test with a non-existent directory (should return empty results)
    const result = await checkCompatibility({
      dir: "non-existent-directory",
      target: "2020",
    });

    expect(result).toHaveProperty("errors");
    expect(result).toHaveProperty("warnings");
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  test("should work with configuration detection", async () => {
    const { detectProjectConfig } = await import("../index.js");

    const config = detectProjectConfig(process.cwd());

    expect(config).toHaveProperty("target");
    expect(config).toHaveProperty("targetSource");
    expect(config).toHaveProperty("outputDir");
    expect(config).toHaveProperty("outputSource");
    expect(config).toHaveProperty("browserslist");
    expect(config).toHaveProperty("browserslistSource");
  });

  test("should work with browser targets", async () => {
    const { getBrowserTargetsFromString } = await import("../index.js");

    const browsers2015 = getBrowserTargetsFromString("2015");
    const browsers2020 = getBrowserTargetsFromString("2020");
    const browsersLatest = getBrowserTargetsFromString("latest");

    expect(typeof browsers2015).toBe("string");
    expect(typeof browsers2020).toBe("string");
    expect(typeof browsersLatest).toBe("string");
    expect(browsers2015.length).toBeGreaterThan(0);
    expect(browsers2020.length).toBeGreaterThan(0);
    expect(browsersLatest.length).toBeGreaterThan(0);
  });

  test("should work with validation", async () => {
    const { validateConfig } = await import("../index.js");

    // This should throw an error for non-existent directory
    expect(() => {
      validateConfig({
        dir: "non-existent-directory",
        target: "2020",
      });
    }).toThrow();
  });

  test("should work with global state", async () => {
    const { setVerboseMode, getGlobalState } = await import("../index.js");

    setVerboseMode(true);
    const state = getGlobalState();

    expect(state).toHaveProperty("verbose");
    expect(state.verbose).toBe(true);

    setVerboseMode(false);
    const state2 = getGlobalState();
    expect(state2.verbose).toBe(false);
  });

  test("should handle different ES target formats", async () => {
    const { getBrowserTargetsFromString } = await import("../index.js");

    // Test year format
    expect(getBrowserTargetsFromString("2015")).toBeDefined();
    expect(getBrowserTargetsFromString("2020")).toBeDefined();

    // Test numeric format
    expect(getBrowserTargetsFromString("6")).toBeDefined();
    expect(getBrowserTargetsFromString("11")).toBeDefined();

    // Test latest
    expect(getBrowserTargetsFromString("latest")).toBeDefined();
  });

  test("should detect project type", async () => {
    const { getCurrentProjectType } = await import("../index.js");

    const projectType = getCurrentProjectType();
    expect(typeof projectType).toBe("string");
    expect(["nextjs", "vite", "webpack", "rollup", "parcel", "generic"]).toContain(projectType);
  });

  test("should work with individual detection functions", async () => {
    const { detectTarget, detectOutputDir, detectBrowserslist } = await import("../index.js");

    // Test individual detection functions
    const target = detectTarget(process.cwd());
    const outputDir = detectOutputDir(process.cwd());
    const browserslist = detectBrowserslist(process.cwd());

    // These might be null if no config is found, but should be objects if found
    if (target) {
      expect(target).toHaveProperty("target");
      expect(target).toHaveProperty("source");
    }
    if (outputDir) {
      expect(outputDir).toHaveProperty("outputDir");
      expect(outputDir).toHaveProperty("source");
    }
    if (browserslist) {
      expect(browserslist).toHaveProperty("browserslist");
      expect(browserslist).toHaveProperty("source");
    }
  });

  test("should work with global state management", async () => {
    const { setGlobalState, getGlobalState, setDebugMode } = await import("../index.js");

    // Test setting multiple state options
    setGlobalState({
      verbose: true,
      debug: true,
    });

    const state = getGlobalState();
    expect(state.verbose).toBe(true);
    expect(state.debug).toBe(true);

    // Test individual state setters
    setDebugMode(false);
    const state2 = getGlobalState();
    expect(state2.debug).toBe(false);
  });

  test("should handle compatibility check with custom browsers", async () => {
    const { checkCompatibility } = await import("../index.js");

    const result = await checkCompatibility({
      dir: "non-existent-directory",
      target: "2015",
      browsers: "> 1%, last 2 versions, not dead, ie 11",
    });

    expect(result).toHaveProperty("errors");
    expect(result).toHaveProperty("warnings");
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  test("should work with parseEcmaVersion", async () => {
    const { parseEcmaVersion } = await import("../index.js");

    // Test valid formats
    expect(parseEcmaVersion("2015")).toBe(2015);
    expect(parseEcmaVersion("2020")).toBe(2020);
    expect(parseEcmaVersion("6")).toBe(6);
    expect(parseEcmaVersion("11")).toBe(11);
    expect(parseEcmaVersion("latest")).toBe("latest");

    // Test invalid formats
    expect(parseEcmaVersion("invalid")).toBeNull();
    expect(parseEcmaVersion("9999")).toBeNull();
  });

  test("should work with getBrowserTargets", async () => {
    const { getBrowserTargets } = await import("../index.js");

    // Test with different ECMA versions
    expect(getBrowserTargets(2015)).toBeDefined();
    expect(getBrowserTargets(2020)).toBeDefined();
    expect(getBrowserTargets("latest")).toBeDefined();
    expect(getBrowserTargets(null)).toBeDefined(); // Should return default
  });

  test("should handle formatViolationMessage", async () => {
    const { formatViolationMessage } = await import("../index.js");

    const mockMessage = {
      ruleId: "compat/compat",
      severity: 2 as const,
      message: "Test message",
      line: 1,
      column: 1,
    };

    const formatted = formatViolationMessage(mockMessage);
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);
  });

  test("should work with real directory structure", async () => {
    const { checkCompatibility } = await import("../index.js");

    // Create a temporary test directory with JS files
    const testDir = "test-temp-api";
    const testFile = path.join(testDir, "test.js");

    try {
      // Create directory and file
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(testFile, "const test = () => {};");

      // Test compatibility check (ESLint handles directory traversal)
      const result = await checkCompatibility({
        dir: testDir,
        target: "2015",
      });

      expect(result).toHaveProperty("errors");
      expect(result).toHaveProperty("warnings");
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    } finally {
      // Cleanup
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    }
  });

  test("should handle edge cases gracefully", async () => {
    const { checkCompatibility, validateConfig } = await import("../index.js");

    // Test with non-existent directory (should handle gracefully)
    const result = await checkCompatibility({
      dir: "non-existent-directory",
      target: "2015",
    });

    expect(result).toHaveProperty("errors");
    expect(result).toHaveProperty("warnings");

    // Test validation with empty target
    expect(() => {
      validateConfig({
        dir: "non-existent-directory",
        target: "",
      });
    }).toThrow();
  });

  test("should work with different working directories", async () => {
    const { detectProjectConfig } = await import("../index.js");

    // Test with current directory
    const config1 = detectProjectConfig(process.cwd());
    expect(config1).toHaveProperty("target");

    // Test with parent directory (might not have config files)
    const config2 = detectProjectConfig(path.dirname(process.cwd()));
    // When no config files are found, it returns an empty object
    expect(typeof config2).toBe("object");
    expect(config2).toBeDefined();

    // Test with non-existent directory
    const config3 = detectProjectConfig("/non/existent/path");
    expect(typeof config3).toBe("object");
    expect(config3).toBeDefined();
  });

  test("should maintain backward compatibility", async () => {
    // Test that all functions can be imported individually
    const {
      checkCompatibility,
      detectProjectConfig,
      getBrowserTargetsFromString,
      validateConfig,
      getCurrentProjectType,
      setVerboseMode,
      setDebugMode,
      getGlobalState,
      setGlobalState,
      formatViolationMessage,
      detectTarget,
      detectOutputDir,
      detectBrowserslist,
      getBrowserTargets,
      parseEcmaVersion,
    } = await import("../index.js");

    // Verify all functions are callable
    expect(typeof checkCompatibility).toBe("function");
    expect(typeof detectProjectConfig).toBe("function");
    expect(typeof getBrowserTargetsFromString).toBe("function");
    expect(typeof validateConfig).toBe("function");
    expect(typeof getCurrentProjectType).toBe("function");
    expect(typeof setVerboseMode).toBe("function");
    expect(typeof setDebugMode).toBe("function");
    expect(typeof getGlobalState).toBe("function");
    expect(typeof setGlobalState).toBe("function");
    expect(typeof formatViolationMessage).toBe("function");
    expect(typeof detectTarget).toBe("function");
    expect(typeof detectOutputDir).toBe("function");
    expect(typeof detectBrowserslist).toBe("function");
    expect(typeof getBrowserTargets).toBe("function");
    expect(typeof parseEcmaVersion).toBe("function");
  });
});
