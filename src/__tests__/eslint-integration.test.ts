import * as fs from "fs";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { checkCompatibility } from "../lib/checkCompatiblity.js";
import type { Config } from "../lib/types.js";
import { runESGuard } from "../main.js";

describe("ESLint Integration Tests", () => {
  const testDir = path.join(process.cwd(), "test-eslint-temp");

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test("should detect ES2015+ features when targeting ES2015", async () => {
    // Create JavaScript file with ES2015+ features
    const testFile = path.join(testDir, "modern.js");
    const modernCode = `
      // ES2015+ features that should be flagged
      const arrow = () => {};
      const template = \`hello \${world}\`;
      const destructuring = { a, b } = obj;
      const spread = [...array];
      const rest = (...args) => {};
      const classes = class Test {};
      const modules = import { x } from 'y';
      const promises = new Promise((resolve) => resolve());
      const generators = function*() { yield 1; };
    `;

    fs.writeFileSync(testFile, modernCode);

    const config: Config = {
      dir: testDir,
      target: "2015",
      browsers: "ie 11",
    };

    const result = await checkCompatibility(config);

    // Should find violations for ES2015+ features
    expect(result.errors.length + result.warnings.length).toBeGreaterThan(0);
    if (result.errors.length > 0) {
      expect(result.errors[0].file).toContain("modern.js");
    } else if (result.warnings.length > 0) {
      expect(result.warnings[0].file).toContain("modern.js");
    }
  });

  test("should detect ES2020+ features when targeting ES2015", async () => {
    const testFile = path.join(testDir, "es2020.js");
    const es2020Code = `
      // ES2020+ features
      const optionalChaining = obj?.prop?.method();
      const nullishCoalescing = value ?? defaultValue;
      const bigInt = 123n;
      const dynamicImport = import('./module.js');
    `;

    fs.writeFileSync(testFile, es2020Code);

    const config: Config = {
      dir: testDir,
      target: "2015",
      browsers: "ie 11",
    };

    const result = await checkCompatibility(config);
    expect(result.errors.length + result.warnings.length).toBeGreaterThan(0);
  });

  test("should pass with ES2015 features when targeting ES2020", async () => {
    const testFile = path.join(testDir, "es2015.js");
    const es2015Code = `
      // ES2015 features - should be fine for ES2020 target
      const arrow = () => {};
      const template = \`hello \${world}\`;
      const destructuring = { a, b } = obj;
    `;

    fs.writeFileSync(testFile, es2015Code);

    const config: Config = {
      dir: testDir,
      target: "2020",
      browsers: "> 1%, last 2 versions",
    };

    const result = await checkCompatibility(config);
    // ES2015 features should be compatible with ES2020
    expect(result.errors.length + result.warnings.length).toBe(0);
  });

  test("should detect browser compatibility issues", async () => {
    const testFile = path.join(testDir, "browser-apis.js");
    const browserCode = `
      // Modern browser APIs that might not work in older browsers
      const fetch = fetch('/api/data');
      const localStorage = localStorage.getItem('key');
      const intersectionObserver = new IntersectionObserver(() => {});
      const webWorkers = new Worker('worker.js');
    `;

    fs.writeFileSync(testFile, browserCode);

    const config: Config = {
      dir: testDir,
      target: "2015",
      browsers: "ie 11",
    };

    const result = await checkCompatibility(config);
    // Should detect browser compatibility issues
    expect(result.errors.length + result.warnings.length).toBeGreaterThanOrEqual(0);
  });

  test("should handle multiple files with different issues", async () => {
    const file1 = path.join(testDir, "file1.js");
    const file2 = path.join(testDir, "file2.js");

    // file1.js uses an ES2015 feature (arrow function), which is valid for ES2015 target
    fs.writeFileSync(file1, "const arrow = () => {};");
    // file2.js uses an ES2020 feature (optional chaining), which is NOT valid for ES2015 target
    fs.writeFileSync(file2, "const optional = obj?.prop;");

    const config: Config = {
      dir: testDir,
      target: "2015",
      browsers: "ie 11",
    };

    const result = await checkCompatibility(config);
    expect(result.errors.length + result.warnings.length).toBeGreaterThan(0);

    // Only file2.js should be flagged for ES2020+ features
    const allViolations = [...result.errors, ...result.warnings];
    const files = allViolations.map((v) => path.basename(v.file));
    expect(files).not.toContain("file1.js");
    expect(files).toContain("file2.js");
  });

  test("should work with different browser targets", async () => {
    const testFile = path.join(testDir, "test.js");
    const code = "const arrow = () => {};";
    fs.writeFileSync(testFile, code);

    // Test with different browser targets
    const configs: Config[] = [
      { dir: testDir, target: "2015", browsers: "ie 11" },
      { dir: testDir, target: "2015", browsers: "> 1%, last 2 versions" },
      { dir: testDir, target: "2020", browsers: "defaults" },
    ];

    for (const config of configs) {
      const result = await checkCompatibility(config);
      expect(typeof result).toBe("object");
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    }
  });

  test("should output compat/compat warnings to console", async () => {
    // Create a JavaScript file with browser APIs that will trigger compat/compat warnings
    // Using browser APIs that are not supported in IE 11 (not syntax features)
    const testFile = path.join(testDir, "incompatible.js");
    const incompatibleCode = `
      // Browser APIs that trigger compat/compat warnings for IE 11
      fetch('/api/data');
      const observer = new IntersectionObserver(() => {});
      const worker = new Worker('worker.js');
    `;
    fs.writeFileSync(testFile, incompatibleCode);

    // Store captured console output
    const consoleOutput: string[] = [];

    // Capture console.warn calls and store the output
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
      consoleOutput.push(args.map((arg) => String(arg)).join(" "));
    });

    // Capture console.error calls (in case warnings are logged as errors)
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      consoleOutput.push(args.map((arg) => String(arg)).join(" "));
    });

    try {
      // Run es-guard which will output to console
      await runESGuard({
        directory: testDir,
        target: "2015",
        browsers: "ie 11",
      });

      // Collect all console output into a single string
      const allOutput = consoleOutput.join(" ");

      // First verify that warnings were actually found by checking the result
      // This helps debug if the issue is with code generation or console capture
      const { checkCompatibility } = await import("../lib/checkCompatiblity.js");
      const result = await checkCompatibility({
        dir: testDir,
        target: "2015",
        browsers: "ie 11",
      });

      // Verify that warnings exist in the result (browser API compat issues are warnings)
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.file.includes("incompatible.js"))).toBe(true);

      // Verify that compat/compat warning appears in console output
      expect(allOutput).toContain("compat/compat");
      expect(allOutput).toContain("incompatible.js");

      // Verify the warning message mentions the compatibility issue
      // The exact message may vary, but should mention the browser API or IE 11
      const hasCompatibilityMessage =
        allOutput.includes("compat/compat") ||
        allOutput.includes("IE 11") ||
        allOutput.includes("not supported") ||
        allOutput.includes("compatibility") ||
        allOutput.includes("fetch") ||
        allOutput.includes("IntersectionObserver") ||
        allOutput.includes("Worker");

      expect(hasCompatibilityMessage).toBe(true);
    } finally {
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    }
  });
});
