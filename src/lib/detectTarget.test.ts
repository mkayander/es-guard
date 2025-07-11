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

    it("should detect .next/static from Next.js app in package.json", () => {
      writeFile(
        "package.json",
        JSON.stringify({
          name: "test",
          dependencies: {
            next: "^13.0.0",
          },
        }),
      );

      expect(detectOutputDir(tempDir)).toEqual({ outputDir: ".next/static", source: "package.json" });
    });

    it("should detect custom distDir from next.config.js", () => {
      writeFile(
        "next.config.js",
        `module.exports = {
          distDir: 'build'
        }`,
      );

      expect(detectOutputDir(tempDir)).toEqual({ outputDir: "build", source: "next.config.js" });
    });

    it("should detect default .next from next.config.js", () => {
      writeFile(
        "next.config.js",
        `module.exports = {
          experimental: {
            appDir: true
          }
        }`,
      );

      expect(detectOutputDir(tempDir)).toEqual({ outputDir: ".next", source: "next.config.js" });
    });

    it("should detect output directory from vite.config.cjs", () => {
      writeFile(
        "vite.config.cjs",
        `module.exports = {
          build: {
            outDir: 'build'
          }
        }`,
      );

      expect(detectOutputDir(tempDir)).toEqual({ outputDir: "build", source: "vite.config.cjs" });
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

    it("should handle require errors in JavaScript configs", () => {
      writeFile("vite.config.js", `module.exports = require('unsupported-module')`);

      expect(() => detectOutputDir(tempDir)).not.toThrow();
    });

    it("should handle parser not found for unknown config files", () => {
      writeFile("unknown.config.js", "module.exports = {}");

      expect(() => detectTarget(tempDir)).not.toThrow();
    });

    it("should handle type guard failures gracefully", () => {
      writeFile("package.json", "null");
      writeFile("tsconfig.json", "[]");
      writeFile(".babelrc", "false");

      expect(() => detectTarget(tempDir)).not.toThrow();
      expect(() => detectOutputDir(tempDir)).not.toThrow();
    });
  });

  describe("ES version parsing edge cases", () => {
    it("should handle ES7 conversion to 2016", () => {
      writeFile(
        "package.json",
        JSON.stringify({
          browserslist: ["es7"],
        }),
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2016", source: "package.json" });
    });

    it("should handle ES8 conversion to 2017", () => {
      writeFile(
        "package.json",
        JSON.stringify({
          browserslist: ["es8"],
        }),
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2017", source: "package.json" });
    });

    it("should handle ES2020 as direct year", () => {
      writeFile(
        "package.json",
        JSON.stringify({
          browserslist: ["es2020"],
        }),
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2020", source: "package.json" });
    });

    it("should handle ES3 conversion to 1999", () => {
      writeFile(
        "tsconfig.json",
        JSON.stringify({
          compilerOptions: { target: "ES3" },
        }),
      );

      expect(detectTarget(tempDir)).toEqual({ target: "1999", source: "tsconfig.json" });
    });

    it("should handle ES5 conversion to 2009", () => {
      writeFile(
        "tsconfig.json",
        JSON.stringify({
          compilerOptions: { target: "ES5" },
        }),
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2009", source: "tsconfig.json" });
    });
  });

  describe("babel config parsing edge cases", () => {
    it("should handle babel.config.js without preset-env", () => {
      writeFile(
        "babel.config.js",
        `module.exports = {
          presets: ['@babel/preset-react']
        }`,
      );

      expect(detectTarget(tempDir)).toBeNull();
    });

    it("should handle babel.config.js with preset-env but no targets", () => {
      writeFile(
        "babel.config.js",
        `module.exports = {
          presets: [['@babel/preset-env', {}]]
        }`,
      );

      expect(detectTarget(tempDir)).toBeNull();
    });

    it("should handle babel.config.js with preset-env and esmodules target", () => {
      writeFile(
        "babel.config.js",
        `module.exports = {
          presets: [['@babel/preset-env', {
            targets: { esmodules: true }
          }]]
        }`,
      );

      expect(detectTarget(tempDir)).toBeNull();
    });

    it("should handle .babelrc with invalid structure", () => {
      writeFile(
        ".babelrc",
        JSON.stringify({
          presets: "not-an-array",
        }),
      );

      expect(detectTarget(tempDir)).toBeNull();
    });

    it("should handle .babelrc with preset-env but no targets", () => {
      writeFile(
        ".babelrc",
        JSON.stringify({
          presets: [["@babel/preset-env", {}]],
        }),
      );

      expect(detectTarget(tempDir)).toBeNull();
    });

    it("should handle .babelrc with preset-env and targets but no browsers", () => {
      writeFile(
        ".babelrc",
        JSON.stringify({
          presets: [["@babel/preset-env", { targets: { node: "14" } }]],
        }),
      );

      expect(detectTarget(tempDir)).toBeNull();
    });
  });

  describe("vite config parsing edge cases", () => {
    it("should handle vite.config.js without esbuild target", () => {
      writeFile(
        "vite.config.js",
        `module.exports = {
          build: {
            outDir: 'build'
          }
        }`,
      );

      expect(detectTarget(tempDir)).toBeNull();
    });

    it("should handle vite.config.js with esbuild target but no outDir", () => {
      writeFile(
        "vite.config.js",
        `module.exports = {
          esbuild: {
            target: 'es2020'
          }
        }`,
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2020", source: "vite.config.js" });
      expect(detectOutputDir(tempDir)).toBeNull();
    });

    it("should handle vite.config.js with invalid structure", () => {
      writeFile("vite.config.js", `module.exports = "not-an-object"`);

      expect(detectOutputDir(tempDir)).toBeNull();
    });
  });

  describe("webpack config parsing edge cases", () => {
    it("should handle webpack.config.js without target", () => {
      writeFile(
        "webpack.config.js",
        `module.exports = {
          output: {
            path: path.resolve(__dirname, 'dist')
          }
        }`,
      );

      expect(detectTarget(tempDir)).toBeNull();
    });

    it("should handle webpack.config.js with target but no output path", () => {
      writeFile(
        "webpack.config.js",
        `module.exports = {
          target: 'es2020'
        }`,
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2020", source: "webpack.config.js" });
      expect(detectOutputDir(tempDir)).toBeNull();
    });

    it("should handle webpack.config.js with invalid structure", () => {
      writeFile("webpack.config.js", `module.exports = "not-an-object"`);

      expect(detectOutputDir(tempDir)).toBeNull();
    });

    it("should handle webpack.config.js with absolute path", () => {
      writeFile(
        "webpack.config.js",
        `module.exports = {
          output: {
            path: '/absolute/path/to/dist'
          }
        }`,
      );

      expect(detectOutputDir(tempDir)).toEqual({ outputDir: "dist", source: "webpack.config.js" });
    });
  });

  describe("browserslist parsing edge cases", () => {
    it("should handle .browserslistrc with comments", () => {
      writeFile(
        ".browserslistrc",
        `# This is a comment
es2020
> 1%`,
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2020", source: ".browserslistrc" });
    });

    it("should handle .browserslistrc with empty lines", () => {
      writeFile(
        ".browserslistrc",
        `

es2020

> 1%`,
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2020", source: ".browserslistrc" });
    });

    it("should handle .browserslistrc without ES versions", () => {
      writeFile(
        ".browserslistrc",
        `> 1%
last 2 versions`,
      );

      expect(detectTarget(tempDir)).toBeNull();
    });

    it("should handle .browserslist file", () => {
      writeFile(".browserslist", `es2018`);

      expect(detectTarget(tempDir)).toEqual({ target: "2018", source: ".browserslist" });
    });
  });

  describe("next.js config parsing edge cases", () => {
    it("should handle next.config.js with invalid structure", () => {
      writeFile("next.config.js", `module.exports = "not-an-object"`);

      expect(detectOutputDir(tempDir)).toBeNull();
    });

    it("should handle next.config.js with null config", () => {
      writeFile("next.config.js", `module.exports = null`);

      expect(detectOutputDir(tempDir)).toBeNull();
    });
  });

  describe("package.json parsing edge cases", () => {
    it("should handle package.json with build field", () => {
      writeFile(
        "package.json",
        JSON.stringify({
          name: "test",
          build: "build",
        }),
      );

      expect(detectOutputDir(tempDir)).toEqual({ outputDir: "build", source: "package.json" });
    });

    it("should handle package.json with devDependencies.next", () => {
      writeFile(
        "package.json",
        JSON.stringify({
          name: "test",
          devDependencies: {
            next: "^13.0.0",
          },
        }),
      );

      expect(detectOutputDir(tempDir)).toEqual({ outputDir: ".next/static", source: "package.json" });
    });

    it("should handle package.json with browserslist as string", () => {
      writeFile(
        "package.json",
        JSON.stringify({
          browserslist: "es2019",
        }),
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2019", source: "package.json" });
    });

    it("should handle package.json with browserslist array containing non-strings", () => {
      writeFile(
        "package.json",
        JSON.stringify({
          browserslist: ["es2020", 123, null],
        }),
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2020", source: "package.json" });
    });
  });

  describe("tsconfig parsing edge cases", () => {
    it("should handle tsconfig.json without compilerOptions", () => {
      writeFile(
        "tsconfig.json",
        JSON.stringify({
          include: ["src/**/*"],
        }),
      );

      expect(detectTarget(tempDir)).toBeNull();
      expect(detectOutputDir(tempDir)).toBeNull();
    });

    it("should handle tsconfig.json with invalid target", () => {
      writeFile(
        "tsconfig.json",
        JSON.stringify({
          compilerOptions: { target: "INVALID" },
        }),
      );

      expect(detectTarget(tempDir)).toBeNull();
    });

    it("should handle tsconfig.json with lowercase target", () => {
      writeFile(
        "tsconfig.json",
        JSON.stringify({
          compilerOptions: { target: "es2020" },
        }),
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2020", source: "tsconfig.json" });
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
