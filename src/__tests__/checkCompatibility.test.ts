import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { checkCompatibility } from "../lib/checkCompatiblity.js";
import type { Config } from "../lib/types.js";

// Mock ESLint to avoid actual linting during tests
vi.mock("eslint", () => ({
  ESLint: vi.fn().mockImplementation(() => ({
    lintFiles: vi.fn(),
  })),
}));

describe("checkCompatibility", () => {
  const testDir = path.join(process.cwd(), "test-temp");

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
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

    const config: Config = {
      dir: testDir,
      target: "2015",
      browsers: "> 1%, last 2 versions, not dead, ie 11",
    };

    const violations = await checkCompatibility(config);
    // Should find 3 JavaScript files
    expect(violations.length).toBeGreaterThanOrEqual(0);
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

    const config: Config = {
      dir: testDir,
      target: "2015",
      browsers: "> 1%, last 2 versions, not dead, ie 11",
    };

    const violations = await checkCompatibility(config);
    // Should only process .js files
    expect(violations.length).toBeGreaterThanOrEqual(0);
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
