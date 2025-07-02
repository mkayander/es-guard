import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { checkCompatibility } from "../lib/checkCompatiblity.js";
import type { Config } from "../lib/types.js";

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

  test("should return empty array when no JavaScript files found", async () => {
    const config: Config = {
      dir: testDir,
      target: "2015",
      browsers: "> 1%, last 2 versions, not dead, ie 11",
    };

    const violations = await checkCompatibility(config);
    expect(violations).toEqual([]);
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

    const violations = await checkCompatibility(config);

    // Should process 3 JavaScript files (even if no violations found)
    expect(mockLintFiles).toHaveBeenCalledTimes(3);
    expect(mockLintFiles).toHaveBeenCalledWith([testFile1]);
    expect(mockLintFiles).toHaveBeenCalledWith([testFile2]);
    expect(mockLintFiles).toHaveBeenCalledWith([testFile3]);
    expect(violations).toEqual([]);
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

    const violations = await checkCompatibility(config);

    // Should only process the .js file (ignore .ts, .json, .txt)
    expect(mockLintFiles).toHaveBeenCalledTimes(1);
    expect(mockLintFiles).toHaveBeenCalledWith([jsFile]);
    expect(violations).toEqual([]);
  });

  test("should handle directory that does not exist", async () => {
    const config: Config = {
      dir: path.join(testDir, "nonexistent"),
      target: "2015",
      browsers: "> 1%, last 2 versions, not dead, ie 11",
    };

    const violations = await checkCompatibility(config);
    expect(violations).toEqual([]);
  });

  test("should handle empty directory", async () => {
    const config: Config = {
      dir: testDir,
      target: "2015",
      browsers: "> 1%, last 2 versions, not dead, ie 11",
    };

    const violations = await checkCompatibility(config);
    expect(violations).toEqual([]);
  });
});
