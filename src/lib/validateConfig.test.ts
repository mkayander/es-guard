import { describe, test, expect, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { validateConfig } from "./validateConfig.js";
import type { Config } from "./types.js";

const tempDir = path.join(process.cwd(), "test-validate-config-temp");

describe("validateConfig", () => {
  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("should not throw for valid config with browsers", () => {
    fs.mkdirSync(tempDir, { recursive: true });
    const config: Config = {
      dir: tempDir,
      target: "2015",
      browsers: "> 1%, last 2 versions, not dead, ie 11",
    };
    expect(() => validateConfig(config)).not.toThrow();
  });

  test("should not throw for valid config without browsers", () => {
    fs.mkdirSync(tempDir, { recursive: true });
    const config: Config = {
      dir: tempDir,
      target: "2015",
    };
    expect(() => validateConfig(config)).not.toThrow();
  });

  test("should throw if directory does not exist", () => {
    const config: Config = {
      dir: tempDir + "-nonexistent",
      target: "2015",
      browsers: "> 1%, last 2 versions, not dead, ie 11",
    };
    expect(() => validateConfig(config)).toThrow(/does not exist/);
  });

  test("should throw if target is missing", () => {
    fs.mkdirSync(tempDir, { recursive: true });
    const config = {
      dir: tempDir,
      target: "",
      browsers: "> 1%, last 2 versions, not dead, ie 11",
    } as Config;
    expect(() => validateConfig(config)).toThrow(/Target ES version is required/);
  });

  test("should not throw if browsers is missing (it's optional)", () => {
    fs.mkdirSync(tempDir, { recursive: true });
    const config: Config = {
      dir: tempDir,
      target: "2015",
    };
    expect(() => validateConfig(config)).not.toThrow();
  });
});
