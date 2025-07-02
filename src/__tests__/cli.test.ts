import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// Mock the checkCompatibility function
vi.mock("../lib/checkCompatiblity.js", () => ({
  checkCompatibility: vi.fn(),
}));

describe("CLI Tests", () => {
  const testDir = path.join(process.cwd(), "test-cli-temp");

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    vi.clearAllMocks();
  });

  test("should show help when --help is passed", () => {
    const result = execSync("node dist/cli.js --help", {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    expect(result).toContain("ES-Guard");
    expect(result).toContain("Usage: es-guard");
    expect(result).toContain("Options:");
  });

  test("should show version when --version is passed", () => {
    const result = execSync("node dist/cli.js --version", {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    expect(result).toContain("ES-Guard v");
  });

  test("should handle invalid directory gracefully", () => {
    try {
      execSync("node dist/cli.js nonexistent-dir", {
        encoding: "utf8",
        cwd: process.cwd(),
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (error: unknown) {
      const execError = error as { status: number; stderr: string };
      expect(execError.status).toBe(1);
      expect(execError.stderr).toContain("does not exist");
    }
  });

  test("should handle invalid ES target format", () => {
    try {
      execSync("node dist/cli.js -t invalid dist", {
        encoding: "utf8",
        cwd: process.cwd(),
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (error: unknown) {
      const execError = error as { status: number; stderr: string };
      expect(execError.status).toBe(1);
      expect(execError.stderr).toContain("Invalid ES target");
    }
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
});
