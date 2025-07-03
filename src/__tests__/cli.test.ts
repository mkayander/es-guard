import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const testDir = path.join(process.cwd(), "test-cli-temp");

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
    const result = execSync("node dist/cli.js --help", {
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
    const result = execSync("node dist/cli.js --version", {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    expect(result.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("should handle invalid directory gracefully", () => {
    expect(() => {
      execSync("node dist/cli.js nonexistent-directory", {
        encoding: "utf8",
        cwd: process.cwd(),
      });
    }).toThrow();
  });

  test("should handle invalid ES target format", () => {
    expect(() => {
      execSync("node dist/cli.js -t invalid", {
        encoding: "utf8",
        cwd: process.cwd(),
      });
    }).toThrow();
  });

  test("should accept valid arguments", () => {
    // Create a test file
    const testFile = path.join(testDir, "test.js");
    fs.writeFileSync(testFile, 'console.log("test");');

    const result = execSync(`node dist/cli.js -t 2015 -b "ie 11" "${testDir}"`, {
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

    const result = execSync(`node dist/cli.js -t 2015 "${testDir}"`, {
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

    const result = execSync(`node dist/cli.js -t 6 "${testDir}"`, {
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

    const result = execSync(`node dist/cli.js -t latest "${testDir}"`, {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    expect(result).toContain("ES-Guard");
    expect(result).toContain("Target ES version: latest");
  });
});
