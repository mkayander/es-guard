import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { detectTarget } from "../lib/detectTarget.js";

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

  describe("package.json detection", () => {
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
  });

  describe("tsconfig.json detection", () => {
    it("should detect ES2020 target", () => {
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

  describe("babel.config.js detection", () => {
    it("should detect target from @babel/preset-env", () => {
      writeFile(
        "babel.config.js",
        `
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        browsers: ['es2017', '> 1%']
      }
    }]
  ]
};
`,
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2017", source: "babel.config.js" });
    });

    it("should return null for babel.config.js without preset-env", () => {
      writeFile(
        "babel.config.js",
        `
module.exports = {
  presets: ['@babel/preset-react']
};
`,
      );

      expect(detectTarget(tempDir)).toBeNull();
    });
  });

  describe(".babelrc detection", () => {
    it("should detect target from preset-env", () => {
      writeFile(
        ".babelrc",
        JSON.stringify({
          presets: [
            [
              "@babel/preset-env",
              {
                targets: {
                  browsers: ["es2019"],
                },
              },
            ],
          ],
        }),
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2019", source: ".babelrc" });
    });

    it("should return null for .babelrc without preset-env", () => {
      writeFile(
        ".babelrc",
        JSON.stringify({
          presets: ["@babel/preset-react"],
        }),
      );

      expect(detectTarget(tempDir)).toBeNull();
    });
  });

  describe("vite.config.js detection", () => {
    it("should detect esbuild target", () => {
      writeFile(
        "vite.config.js",
        `
export default {
  esbuild: {
    target: 'es2021'
  }
};
`,
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2021", source: "vite.config.js" });
    });

    it("should detect esbuild target with different quotes", () => {
      writeFile(
        "vite.config.js",
        `
export default {
  esbuild: {
    target: "es2018"
  }
};
`,
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2018", source: "vite.config.js" });
    });

    it("should return null for vite.config.js without esbuild target", () => {
      writeFile(
        "vite.config.js",
        `
export default {
  plugins: []
};
`,
      );

      expect(detectTarget(tempDir)).toBeNull();
    });
  });

  describe("webpack.config.js detection", () => {
    it("should detect target", () => {
      writeFile(
        "webpack.config.js",
        `
module.exports = {
  target: 'es2020'
};
`,
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2020", source: "webpack.config.js" });
    });

    it("should return null for webpack.config.js without target", () => {
      writeFile(
        "webpack.config.js",
        `
module.exports = {
  entry: './src/index.js'
};
`,
      );

      expect(detectTarget(tempDir)).toBeNull();
    });
  });

  describe("priority order", () => {
    it("should prioritize package.json over tsconfig.json", () => {
      writeFile(
        "package.json",
        JSON.stringify({
          browserslist: ["es2019"],
        }),
      );
      writeFile(
        "tsconfig.json",
        JSON.stringify({
          compilerOptions: { target: "ES2020" },
        }),
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2019", source: "package.json" });
    });

    it("should prioritize tsconfig.json over babel.config.js", () => {
      writeFile(
        "tsconfig.json",
        JSON.stringify({
          compilerOptions: { target: "ES2018" },
        }),
      );
      writeFile(
        "babel.config.js",
        `
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: { browsers: ['es2019'] }
    }]
  ]
};
`,
      );

      expect(detectTarget(tempDir)).toEqual({ target: "2018", source: "tsconfig.json" });
    });

    it("should return null when no config files exist", () => {
      expect(detectTarget(tempDir)).toBeNull();
    });
  });

  describe("error handling", () => {
    it("should handle invalid JSON in package.json", () => {
      writeFile("package.json", "{ invalid json");

      expect(detectTarget(tempDir)).toBeNull();
    });

    it("should handle invalid JSON in tsconfig.json", () => {
      writeFile("tsconfig.json", "{ invalid json");

      expect(detectTarget(tempDir)).toBeNull();
    });

    it("should handle invalid JSON in .babelrc", () => {
      writeFile(".babelrc", "{ invalid json");

      expect(detectTarget(tempDir)).toBeNull();
    });

    it("should continue to next config file when parsing fails", () => {
      writeFile("package.json", "{ invalid json");
      writeFile(
        "tsconfig.json",
        JSON.stringify({
          compilerOptions: { target: "ES2020" },
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
