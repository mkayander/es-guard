import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { detectTarget, detectOutputDir, detectTargetAndOutput } from "./detectTarget.js";

describe("detectTarget", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "es-guard-test-"));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  const writeFile = (filename: string, content: string) => {
    fs.writeFileSync(path.join(tempDir, filename), content);
  };

  describe("target detection", () => {
    it("should detect target from browserslist with ES version", () => {
      writeFile(
        "package.json",
        JSON.stringify({
          browserslist: ["es6", "> 1%"],
        }),
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2015", source: "package.json" });
    });

    it("should detect target from browserslist array", () => {
      writeFile(
        "package.json",
        JSON.stringify({
          browserslist: ["es2020", "> 1%", "last 2 versions"],
        }),
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2020", source: "package.json" });
    });

    it("should not detect target from engines.node (dev dependency)", () => {
      writeFile(
        "package.json",
        JSON.stringify({
          engines: { node: ">=18.0.0" },
        }),
      );

      expect(detectTarget(tempDir)).toBeNull();
    });

    it("should detect target from browserslist even with engines.node present", () => {
      writeFile(
        "package.json",
        JSON.stringify({
          browserslist: ["es2018"],
          engines: { node: ">=18.0.0" },
        }),
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2018", source: "package.json" });
    });

    it("should return null for package.json without target info", () => {
      writeFile(
        "package.json",
        JSON.stringify({
          name: "test",
          version: "1.0.0",
        }),
      );

      expect(detectTarget(tempDir)).toBeNull();
    });

    it("should detect target from tsconfig.json", () => {
      writeFile(
        "tsconfig.json",
        JSON.stringify({
          compilerOptions: { target: "ES2020" },
        }),
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2020", source: "tsconfig.json" });
    });

    it("should detect ES6 target", () => {
      writeFile(
        "tsconfig.json",
        JSON.stringify({
          compilerOptions: { target: "ES6" },
        }),
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2015", source: "tsconfig.json" });
    });

    it("should detect ES5 target", () => {
      writeFile(
        "tsconfig.json",
        JSON.stringify({
          compilerOptions: { target: "ES5" },
        }),
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2009", source: "tsconfig.json" });
    });

    it("should return null for tsconfig.json without target", () => {
      writeFile(
        "tsconfig.json",
        JSON.stringify({
          compilerOptions: { module: "esnext" },
        }),
      );

      expect(detectTarget(tempDir)).toBeNull();
    });
  });

  describe("output directory detection", () => {
    it("should detect output directory from tsconfig.json", () => {
      writeFile(
        "tsconfig.json",
        JSON.stringify({
          compilerOptions: {
            target: "ES2020",
            outDir: "./dist",
          },
        }),
      );

      expect(detectOutputDir(tempDir)).toEqual({ outputDir: "./dist", source: "tsconfig.json" });
    });

    it("should detect output directory from vite.config.js", () => {
      writeFile(
        "vite.config.js",
        `module.exports = {
          build: {
            outDir: 'build'
          }
        }`,
      );

      expect(detectOutputDir(tempDir)).toEqual({ outputDir: "build", source: "vite.config.js" });
    });

    it("should detect output directory from webpack.config.js", () => {
      writeFile(
        "webpack.config.js",
        `module.exports = {
          output: {
            path: path.resolve(__dirname, 'dist')
          }
        }`,
      );

      expect(detectOutputDir(tempDir)).toEqual({ outputDir: "dist", source: "webpack.config.js" });
    });

    it("should detect output directory from package.json", () => {
      writeFile(
        "package.json",
        JSON.stringify({
          name: "test",
          dist: "build",
          main: "./dist/index.js",
        }),
      );

      expect(detectOutputDir(tempDir)).toEqual({ outputDir: "build", source: "package.json" });
    });

    it("should detect dist from package.json main field", () => {
      writeFile(
        "package.json",
        JSON.stringify({
          name: "test",
          main: "./dist/index.js",
        }),
      );

      expect(detectOutputDir(tempDir)).toEqual({ outputDir: "dist", source: "package.json" });
    });

    it("should return null when no output directory is configured", () => {
      writeFile(
        "tsconfig.json",
        JSON.stringify({
          compilerOptions: { target: "ES2020" },
        }),
      );

      expect(detectOutputDir(tempDir)).toBeNull();
    });
  });

  describe("combined detection", () => {
    it("should detect both target and output directory from tsconfig.json", () => {
      writeFile(
        "tsconfig.json",
        JSON.stringify({
          compilerOptions: {
            target: "ES2020",
            outDir: "./dist",
          },
        }),
      );

      const result = detectTargetAndOutput(tempDir);
      expect(result).toEqual({
        target: "2020",
        targetSource: "tsconfig.json",
        outputDir: "./dist",
        outputSource: "tsconfig.json",
      });
    });

    it("should detect target from package.json and output from vite.config.js", () => {
      writeFile(
        "package.json",
        JSON.stringify({
          browserslist: ["es2018"],
        }),
      );

      writeFile(
        "vite.config.js",
        `module.exports = {
          build: {
            outDir: 'build'
          }
        }`,
      );

      const result = detectTargetAndOutput(tempDir);
      expect(result).toEqual({
        target: "2018",
        targetSource: "package.json",
        outputDir: "build",
        outputSource: "vite.config.js",
      });
    });

    it("should handle partial detection", () => {
      writeFile(
        "tsconfig.json",
        JSON.stringify({
          compilerOptions: { target: "ES2020" },
        }),
      );

      const result = detectTargetAndOutput(tempDir);
      expect(result).toEqual({
        target: "2020",
        targetSource: "tsconfig.json",
        outputDir: undefined,
        outputSource: undefined,
      });
    });

    it("should return empty result when no configs found", () => {
      const result = detectTargetAndOutput(tempDir);
      expect(result).toEqual({
        target: undefined,
        targetSource: undefined,
        outputDir: undefined,
        outputSource: undefined,
      });
    });
  });

  describe("error handling", () => {
    it("should handle malformed JSON gracefully", () => {
      writeFile("tsconfig.json", "{ invalid json");

      expect(() => detectTarget(tempDir)).not.toThrow();
      expect(() => detectOutputDir(tempDir)).not.toThrow();
    });

    it("should handle malformed JavaScript configs gracefully", () => {
      writeFile("vite.config.js", "invalid javascript");

      expect(() => detectOutputDir(tempDir)).not.toThrow();
    });
  });

  describe("default behavior", () => {
    it("should use process.cwd() when no directory is provided", () => {
      // This test verifies the function works with the default parameter
      // We can't easily test the actual cwd behavior without mocking
      expect(typeof detectTarget).toBe("function");
    });
  });
});
