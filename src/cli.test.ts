import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const testDir = path.join(process.cwd(), "test-cli-temp");
const CLI_CMD = path.join(__dirname, "../dist/cli.js");

describe("CLI Tests", () => {
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

  test("should show help when --help is passed", () => {
    const result = execSync(`node "${CLI_CMD}" --help`, {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    expect(result).toContain("es-guard");
    expect(result).toContain("JavaScript Compatibility Checker");
    expect(result).toContain("Usage:");
    expect(result).toContain("Options:");
    expect(result).toContain("Examples:");
  });

  test("should show version when --version is passed", () => {
    const result = execSync(`node "${CLI_CMD}" --version`, {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    expect(result.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("should handle invalid directory gracefully", () => {
    expect(() => {
      execSync(`node "${CLI_CMD}" nonexistent-directory`, {
        encoding: "utf8",
        cwd: process.cwd(),
      });
    }).toThrow();
  });

  test("should handle invalid ES target format", () => {
    expect(() => {
      execSync(`node "${CLI_CMD}" -t invalid`, {
        encoding: "utf8",
        cwd: process.cwd(),
      });
    }).toThrow();
  });

  test("should accept valid arguments", () => {
    // Create a test file
    const testFile = path.join(testDir, "test.js");
    fs.writeFileSync(testFile, 'console.log("test");');

    const result = execSync(`node "${CLI_CMD}" -t 2015 -b "ie 11" "${testDir}"`, {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    expect(result).toContain("ES-Guard");
    expect(result).toContain("Scanning directory");
  });

  test("should work with auto-determined browsers", () => {
    // Create a test file
    const testFile = path.join(testDir, "test.js");
    fs.writeFileSync(testFile, 'console.log("test");');

    const result = execSync(`node "${CLI_CMD}" -t 2015 "${testDir}"`, {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    expect(result).toContain("ES-Guard");
    expect(result).toContain("Scanning directory");
    expect(result).toContain("auto-determined");
  });

  test("should work with numeric ES versions", () => {
    // Create a test file
    const testFile = path.join(testDir, "test.js");
    fs.writeFileSync(testFile, 'console.log("test");');

    const result = execSync(`node "${CLI_CMD}" -t 6 "${testDir}"`, {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    expect(result).toContain("ES-Guard");
    expect(result).toContain("Target ES version: 6");
  });

  test("should work with latest ES version", () => {
    // Create a test file
    const testFile = path.join(testDir, "test.js");
    fs.writeFileSync(testFile, 'console.log("test");');

    const result = execSync(`node "${CLI_CMD}" -t latest "${testDir}"`, {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    expect(result).toContain("ES-Guard");
    expect(result).toContain("Target ES version: latest");
  });

  test("should auto-detect target from package.json", () => {
    // Create a test file
    const testFile = path.join(testDir, "test.js");
    fs.writeFileSync(testFile, 'console.log("test");');

    // Create package.json with browserslist
    const packageJson = path.join(testDir, "package.json");
    fs.writeFileSync(
      packageJson,
      JSON.stringify({
        name: "test",
        browserslist: ["es2018", "> 1%"],
      }),
    );

    const result = execSync(`node "${CLI_CMD}" "${testDir}"`, {
      encoding: "utf8",
      cwd: testDir,
    });
    expect(result).toContain("ES-Guard");
    expect(result).toContain("Target ES version: 2018 (auto-detected from package.json)");
  });

  test("should auto-detect target from tsconfig.json", () => {
    // Create a test file
    const testFile = path.join(testDir, "test.js");
    fs.writeFileSync(testFile, 'console.log("test");');

    // Create tsconfig.json with target
    const tsconfigJson = path.join(testDir, "tsconfig.json");
    fs.writeFileSync(
      tsconfigJson,
      JSON.stringify({
        compilerOptions: { target: "ES2020" },
      }),
    );

    const result = execSync(`node "${CLI_CMD}" "${testDir}"`, {
      encoding: "utf8",
      cwd: testDir,
    });
    expect(result).toContain("ES-Guard");
    expect(result).toContain("Target ES version: 2020 (auto-detected from tsconfig.json)");
  });

  test("should fail when no target specified and no config files found", () => {
    // Create a test file
    const testFile = path.join(testDir, "test.js");
    fs.writeFileSync(testFile, 'console.log("test");');

    expect(() => {
      execSync(`node "${CLI_CMD}" "${testDir}"`, {
        encoding: "utf8",
        cwd: testDir,
      });
    }).toThrow();
  });

  test("should auto-detect from CWD when no config in target directory", () => {
    // Create a test file in a subdirectory
    const subDir = path.join(testDir, "subdir");
    fs.mkdirSync(subDir, { recursive: true });
    const testFile = path.join(subDir, "test.js");
    fs.writeFileSync(testFile, 'console.log("test");');

    // Create package.json in the test directory (CWD)
    const packageJson = path.join(testDir, "package.json");
    fs.writeFileSync(
      packageJson,
      JSON.stringify({
        name: "test",
        browserslist: ["es2019", "> 1%"],
      }),
    );

    const result = execSync(`node "${CLI_CMD}" "${subDir}"`, {
      encoding: "utf8",
      cwd: testDir,
    });
    expect(result).toContain("ES-Guard");
    expect(result).toContain("Target ES version: 2019 (auto-detected from package.json)");
  });
});
