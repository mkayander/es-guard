import type { Linter } from "eslint";
import * as fs from "fs";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { checkCompatibility, formatViolationMessage } from "./checkCompatiblity.js";
import type { Config, SourceMappedMessage } from "./types.js";

// Mock ESLint to avoid actual linting during tests
const mockLintFiles = vi.fn();
vi.mock("eslint", () => ({
  ESLint: class {
    constructor() {
      // Constructor implementation
    }
    lintFiles = mockLintFiles;
  },
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
    mockLintFiles.mockResolvedValueOnce([]);

    const config: Config = {
      dir: testDir,
      target: "2015",
      browsers: "> 1%, last 2 versions, not dead, ie 11",
    };

    const result = await checkCompatibility(config);
    expect(result).toEqual({ errors: [], warnings: [] });
  });

  test("should work with auto-determined browsers", async () => {
    mockLintFiles.mockResolvedValueOnce([]);

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
    mockLintFiles.mockResolvedValueOnce([]);

    const config: Config = {
      dir: path.join(testDir, "nonexistent"),
      target: "2015",
      browsers: "> 1%, last 2 versions, not dead, ie 11",
    };

    const result = await checkCompatibility(config);
    expect(result).toEqual({ errors: [], warnings: [] });
  });

  test("should handle empty directory", async () => {
    mockLintFiles.mockResolvedValueOnce([]);

    const config: Config = {
      dir: testDir,
      target: "2015",
      browsers: "> 1%, last 2 versions, not dead, ie 11",
    };

    const result = await checkCompatibility(config);
    expect(result).toEqual({ errors: [], warnings: [] });
  });

  test("should include compat/compat warnings and filter out other messages", async () => {
    const testFile = path.join(testDir, "test.js");
    fs.writeFileSync(testFile, 'const x = "test";');

    mockLintFiles.mockResolvedValueOnce([
      {
        filePath: testFile,
        messages: [
          {
            ruleId: "compat/compat",
            severity: 1,
            message: "const is not supported in IE 11",
            line: 1,
            column: 1,
          },
          {
            ruleId: "compat/compat",
            severity: 2,
            message: "Arrow functions are not supported in IE 11",
            line: 2,
            column: 5,
          },
          {
            ruleId: null,
            severity: 2,
            message: "Parsing error: Unexpected token",
            line: 3,
            column: 1,
          },
          {
            ruleId: "some-other-rule",
            severity: 1,
            message: "Some other warning",
            line: 4,
            column: 1,
          },
          {
            ruleId: "compat/compat",
            severity: 1,
            message: "has no effect because you have 'noInlineConfig'",
            line: 5,
            column: 1,
          },
        ],
        errorCount: 2,
        warningCount: 3,
      },
    ]);

    const config: Config = {
      dir: testDir,
      target: "2015",
      browsers: "> 1%, last 2 versions, not dead, ie 11",
    };

    const result = await checkCompatibility(config);

    // All messages are from the same file, so they'll be grouped together
    expect(result.errors).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);

    // Should include compat/compat errors and parsing errors (ruleId: null)
    const allErrorMessages = result.errors.flatMap((e) => e.messages);
    expect(allErrorMessages).toHaveLength(2);
    expect(allErrorMessages.some((m) => m.ruleId === "compat/compat" && m.message.includes("Arrow functions"))).toBe(
      true,
    );
    expect(allErrorMessages.some((m) => m.ruleId === null && m.message.includes("Parsing error"))).toBe(true);

    // Should include compat/compat warnings (but not the noInlineConfig one)
    const allWarningMessages = result.warnings.flatMap((w) => w.messages);
    expect(allWarningMessages).toHaveLength(1);
    expect(allWarningMessages[0].ruleId).toBe("compat/compat");
    expect(allWarningMessages[0].message).toBe("const is not supported in IE 11");
    expect(allWarningMessages[0].message).not.toContain("noInlineConfig");

    // Should NOT include other rule messages or noInlineConfig warnings
    const allMessages = [...allErrorMessages, ...allWarningMessages];
    expect(allMessages.every((m) => m.ruleId === "compat/compat" || m.ruleId === null)).toBe(true);
    expect(allMessages.some((m) => m.ruleId === "some-other-rule")).toBe(false);
    expect(allMessages.some((m) => m.message.includes("noInlineConfig"))).toBe(false);
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
