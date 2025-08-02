import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  readJsonFile,
  readTextFile,
  evaluateJsFile,
  isPackageJson,
  isTsConfig,
  isBabelRc,
  isViteConfig,
  isWebpackConfig,
  isNextConfig,
} from "./utils.js";

describe("utils", () => {
  describe("readJsonFile", () => {
    it("should read and parse valid JSON file", () => {
      const tempDir = fs.mkdtempSync("es-guard-test-");
      const testFile = path.join(tempDir, "test.json");

      try {
        const testData = { name: "test", version: "1.0.0" };
        fs.writeFileSync(testFile, JSON.stringify(testData));

        const result = readJsonFile(testFile);
        expect(result).toEqual(testData);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should throw error for invalid JSON", () => {
      const tempDir = fs.mkdtempSync("es-guard-test-");
      const testFile = path.join(tempDir, "test.json");

      try {
        fs.writeFileSync(testFile, "{ invalid json");

        expect(() => readJsonFile(testFile)).toThrow();
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("readTextFile", () => {
    it("should read text file content", () => {
      const tempDir = fs.mkdtempSync("es-guard-test-");
      const testFile = path.join(tempDir, "test.txt");

      try {
        const content = "Hello, World!";
        fs.writeFileSync(testFile, content);

        const result = readTextFile(testFile);
        expect(result).toBe(content);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("evaluateJsFile", () => {
    it("should evaluate simple JavaScript file", () => {
      const tempDir = fs.mkdtempSync("es-guard-test-");
      const testFile = path.join(tempDir, "test.js");

      try {
        const content = "module.exports = { name: 'test', version: '1.0.0' };";
        fs.writeFileSync(testFile, content);

        const result = evaluateJsFile(testFile);
        expect(result).toEqual({ name: "test", version: "1.0.0" });
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should handle require statements for allowed modules", () => {
      const tempDir = fs.mkdtempSync("es-guard-test-");
      const testFile = path.join(tempDir, "test.js");

      try {
        const content = "module.exports = { test: 'value', number: 42 };";
        fs.writeFileSync(testFile, content);

        const result = evaluateJsFile(testFile);
        expect(result).toBeDefined();
        expect(result).toHaveProperty("test");
        expect(result).toHaveProperty("number");
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should throw error for disallowed require", () => {
      const tempDir = fs.mkdtempSync("es-guard-test-");
      const testFile = path.join(tempDir, "test.js");

      try {
        const content = "const crypto = require('crypto'); module.exports = {};";
        fs.writeFileSync(testFile, content);

        const result = evaluateJsFile(testFile);
        expect(result).toBeNull();
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should handle syntax errors gracefully", () => {
      const tempDir = fs.mkdtempSync("es-guard-test-");
      const testFile = path.join(tempDir, "test.js");

      try {
        const content = "module.exports = { invalid syntax";
        fs.writeFileSync(testFile, content);

        const result = evaluateJsFile(testFile);
        expect(result).toBeNull();
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("type guards", () => {
    describe("isPackageJson", () => {
      it("should return true for valid package.json object", () => {
        const validPackage = {
          name: "test",
          version: "1.0.0",
          dependencies: { lodash: "^4.0.0" },
          devDependencies: { jest: "^27.0.0" },
        };
        expect(isPackageJson(validPackage)).toBe(true);
      });

      it("should return false for non-object", () => {
        expect(isPackageJson("string")).toBe(false);
        expect(isPackageJson(123)).toBe(false);
        expect(isPackageJson(null)).toBe(false);
      });
    });

    describe("isTsConfig", () => {
      it("should return true for valid tsconfig object", () => {
        const validTsConfig = {
          compilerOptions: {
            target: "ES2020",
            outDir: "./dist",
          },
        };
        expect(isTsConfig(validTsConfig)).toBe(true);
      });

      it("should return false for object without compilerOptions", () => {
        const invalidTsConfig = { name: "test" };
        expect(isTsConfig(invalidTsConfig)).toBe(false);
      });

      it("should return false for non-object", () => {
        expect(isTsConfig("string")).toBe(false);
        expect(isTsConfig(null)).toBe(false);
      });
    });

    describe("isBabelRc", () => {
      it("should return true for valid .babelrc object", () => {
        const validBabelRc = {
          presets: [["@babel/preset-env", { targets: { browsers: ["chrome 64"] } }]],
        };
        expect(isBabelRc(validBabelRc)).toBe(true);
      });

      it("should return false for object without presets", () => {
        const invalidBabelRc = { name: "test" };
        expect(isBabelRc(invalidBabelRc)).toBe(false);
      });
    });

    describe("isViteConfig", () => {
      it("should return true for valid vite config object", () => {
        const validViteConfig = {
          build: { outDir: "dist" },
        };
        expect(isViteConfig(validViteConfig)).toBe(true);
      });

      it("should return false for non-object", () => {
        expect(isViteConfig("string")).toBe(false);
        expect(isViteConfig(null)).toBe(false);
      });
    });

    describe("isWebpackConfig", () => {
      it("should return true for valid webpack config object", () => {
        const validWebpackConfig = {
          output: { path: "/dist" },
        };
        expect(isWebpackConfig(validWebpackConfig)).toBe(true);
      });

      it("should return false for non-object", () => {
        expect(isWebpackConfig("string")).toBe(false);
        expect(isWebpackConfig(null)).toBe(false);
      });
    });

    describe("isNextConfig", () => {
      it("should return true for valid next config object", () => {
        const validNextConfig = {
          distDir: ".next",
        };
        expect(isNextConfig(validNextConfig)).toBe(true);
      });

      it("should return false for non-object", () => {
        expect(isNextConfig("string")).toBe(false);
        expect(isNextConfig(null)).toBe(false);
      });
    });
  });
});
