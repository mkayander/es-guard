import type { Linter } from "eslint";
import * as fs from "fs";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { checkCompatibility, formatViolationMessage } from "./checkCompatiblity.js";
import type { Config, SourceMappedMessage } from "./types.js";

// Mock ESLint to avoid actual linting during tests
const mockLintFiles = vi.fn();
vi.mock("eslint", () => ({
  ESLint: vi.fn().mockImplementation(() => ({
    lintFiles: mockLintFiles,
  })),
}));

describe("checkCompatibility", () => {
  const testDir = path.join(process.cwd(), "test-temp");

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    // Reset mock before each test
    mockLintFiles.mockReset();
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    vi.clearAllMocks();
  });

  test("should return empty result when no JavaScript files found", async () => {
    const config: Config = {
      dir: testDir,
      target: "2015",
      browsers: "> 1%, last 2 versions, not dead, ie 11",
    };

    const result = await checkCompatibility(config);
    expect(result).toEqual({ errors: [], warnings: [] });
  });

  test("should work with auto-determined browsers", async () => {
    const config: Config = {
      dir: testDir,
      target: "2015",
      // browsers field omitted - should be auto-determined
    };

    const result = await checkCompatibility(config);
    expect(result).toEqual({ errors: [], warnings: [] });
  });

  test("should find JavaScript files in directory", async () => {
    // Create test JavaScript files
    const testFile1 = path.join(testDir, "test1.js");
    const testFile2 = path.join(testDir, "test2.js");
    const testFile3 = path.join(testDir, "subdir", "test3.js");

    fs.mkdirSync(path.join(testDir, "subdir"), { recursive: true });
    fs.writeFileSync(testFile1, 'console.log("test1");');
    fs.writeFileSync(testFile2, 'console.log("test2");');
    fs.writeFileSync(testFile3, 'console.log("test3");');

    // Mock responses for each file
    mockLintFiles
      .mockResolvedValueOnce([
        {
          filePath: testFile1,
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ])
      .mockResolvedValueOnce([
        {
          filePath: testFile2,
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ])
      .mockResolvedValueOnce([
        {
          filePath: testFile3,
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);

    const config: Config = {
      dir: testDir,
      target: "2015",
      browsers: "> 1%, last 2 versions, not dead, ie 11",
    };

    const result = await checkCompatibility(config);

    // Should process the directory directly (ESLint handles file discovery)
    expect(mockLintFiles).toHaveBeenCalledTimes(1);
    expect(mockLintFiles).toHaveBeenCalledWith([testDir]);
    expect(result).toEqual({ errors: [], warnings: [] });
  });

  test("should ignore non-JavaScript files", async () => {
    // Create mixed file types
    const jsFile = path.join(testDir, "test.js");
    const tsFile = path.join(testDir, "test.ts");
    const jsonFile = path.join(testDir, "test.json");
    const txtFile = path.join(testDir, "test.txt");

    fs.writeFileSync(jsFile, 'console.log("js");');
    fs.writeFileSync(tsFile, 'console.log("ts");');
    fs.writeFileSync(jsonFile, '{"test": "json"}');
    fs.writeFileSync(txtFile, "text file");

    // Mock response for the JS file
    mockLintFiles.mockResolvedValueOnce([
      {
        filePath: jsFile,
        messages: [],
        errorCount: 0,
        warningCount: 0,
      },
    ]);

    const config: Config = {
      dir: testDir,
      target: "2015",
      browsers: "> 1%, last 2 versions, not dead, ie 11",
    };

    const result = await checkCompatibility(config);

    // Should process the directory directly (ESLint handles file filtering)
    expect(mockLintFiles).toHaveBeenCalledTimes(1);
    expect(mockLintFiles).toHaveBeenCalledWith([testDir]);
    expect(result).toEqual({ errors: [], warnings: [] });
  });

  test("should handle directory that does not exist", async () => {
    const config: Config = {
      dir: path.join(testDir, "nonexistent"),
      target: "2015",
      browsers: "> 1%, last 2 versions, not dead, ie 11",
    };

    const result = await checkCompatibility(config);
    expect(result).toEqual({ errors: [], warnings: [] });
  });

  test("should handle empty directory", async () => {
    const config: Config = {
      dir: testDir,
      target: "2015",
      browsers: "> 1%, last 2 versions, not dead, ie 11",
    };

    const result = await checkCompatibility(config);
    expect(result).toEqual({ errors: [], warnings: [] });
  });
});

describe("formatViolationMessage", () => {
  test("should format message without source map information", () => {
    const message: Linter.LintMessage = {
      ruleId: "compat/compat",
      severity: 2,
      message: "ES2015 'const' is not supported in IE 11",
      line: 10,
      column: 5,
    };

    const result = formatViolationMessage(message);
    expect(result).toContain("10:5");
    expect(result).toMatch(/ERROR|WARNING/);
    expect(result).toContain("ES2015 'const' is not supported in IE 11");
    expect(result).toContain("compat/compat");
  });

  test("should format message with source map information", () => {
    const message: Linter.LintMessage = {
      ruleId: "compat/compat",
      severity: 2,
      message: "ES2015 'const' is not supported in IE 11",
      line: 10,
      column: 5,
    };

    const sourceMappedMessage: SourceMappedMessage = {
      ...message,
      originalFile: "src/components/Button.tsx",
      originalLine: 15,
      originalColumn: 8,
    };

    const result = formatViolationMessage(message, sourceMappedMessage);
    expect(result).toContain("10:5");
    expect(result).toMatch(/ERROR|WARNING/);
    expect(result).toContain("ES2015 'const' is not supported in IE 11");
    expect(result).toContain("Original: src/components/Button.tsx:15:8");
  });

  test("should handle source map with webpack:// prefix", () => {
    const message: Linter.LintMessage = {
      ruleId: "compat/compat",
      severity: 2,
      message: "ES2015 'const' is not supported in IE 11",
      line: 10,
      column: 5,
    };

    const sourceMappedMessage: SourceMappedMessage = {
      ...message,
      originalFile: "webpack:///./src/components/Button.tsx",
      originalLine: 15,
      originalColumn: 8,
    };

    const result = formatViolationMessage(message, sourceMappedMessage);
    expect(result).toContain("Original: webpack:///./src/components/Button.tsx:15:8");
  });

  test("should handle message without ruleId", () => {
    const message: Linter.LintMessage = {
      ruleId: null,
      severity: 2,
      message: "ES2015 'const' is not supported in IE 11",
      line: 10,
      column: 5,
    };

    const result = formatViolationMessage(message);
    expect(result).toContain("10:5");
    expect(result).toMatch(/ERROR|WARNING/);
    expect(result).toContain("ES2015 'const' is not supported in IE 11");
  });

  test("should handle source map without original column", () => {
    const message: Linter.LintMessage = {
      ruleId: "compat/compat",
      severity: 2,
      message: "ES2015 'const' is not supported in IE 11",
      line: 10,
      column: 5,
    };

    const sourceMappedMessage: SourceMappedMessage = {
      ...message,
      originalFile: "src/components/Button.tsx",
      originalLine: 15,
      // originalColumn is undefined
    };

    const result = formatViolationMessage(message, sourceMappedMessage);
    expect(result).toContain("Original: src/components/Button.tsx:15:0");
  });

  test("should print a code frame for a real file", () => {
    const tempFile = path.join(process.cwd(), "test-code-frame.js");
    const fileContent = [
      "const a = 1;",
      "const b = 2;",
      "const c = () => { return a + b; }; // error here",
      "console.log(c());",
    ].join("\n");
    fs.writeFileSync(tempFile, fileContent, "utf-8");

    const message: Linter.LintMessage = {
      ruleId: "compat/compat",
      severity: 2,
      message: "Arrow functions are not supported in IE 11",
      line: 3,
      column: 11, // points to the arrow
    };

    const output = formatViolationMessage(message, undefined, process.cwd(), tempFile);
    expect(output).toContain("Arrow functions are not supported in IE 11");
    expect(output).toContain("error");

    fs.unlinkSync(tempFile);
  });
});
