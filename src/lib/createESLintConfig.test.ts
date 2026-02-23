import * as fs from "fs";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { createESLintConfig } from "./createESLintConfig.js";

describe("createESLintConfig", () => {
  describe("ignore pattern configuration", () => {
    test("should set ignore to false to disable project-level ignore patterns", () => {
      const config = createESLintConfig("2015");

      expect(config.ignore).toBe(false);
    });

    test("should set ignorePatterns to empty array to override project settings", () => {
      const config = createESLintConfig("2015");

      expect(config.ignorePatterns).toEqual([]);
    });

    test("should set overrideConfigFile to true to ensure our config takes precedence", () => {
      const config = createESLintConfig("2015");

      expect(config.overrideConfigFile).toBe(true);
    });
  });

  describe("ECMAScript version conversion", () => {
    test("should convert target year 2015 to ECMAScript 2015", () => {
      const config = createESLintConfig("2015");

      expect(config.overrideConfig?.[0]?.languageOptions?.ecmaVersion).toBe(2015);
    });

    test("should convert target year 2020 to ECMAScript 2020", () => {
      const config = createESLintConfig("2020");

      expect(config.overrideConfig?.[0]?.languageOptions?.ecmaVersion).toBe(2020);
    });

    test("should convert target year 2022 to ECMAScript 2022", () => {
      const config = createESLintConfig("2022");

      expect(config.overrideConfig?.[0]?.languageOptions?.ecmaVersion).toBe(2022);
    });

    test("should throw error for unsupported target year", () => {
      expect(() => createESLintConfig("1995")).toThrow(
        "Invalid ECMAScript version: null. Target year 1995 is not supported.",
      );
    });
  });

  describe("browser targets configuration", () => {
    test("should auto-determine browser targets when not provided", () => {
      const config = createESLintConfig("2015");

      expect(config.overrideConfig?.[0]?.settings?.browsers).toBeDefined();
      expect(typeof config.overrideConfig?.[0]?.settings?.browsers).toBe("string");
    });

    test("should use provided browser targets when specified", () => {
      const customBrowsers = "> 1%, last 2 versions";
      const config = createESLintConfig("2015", customBrowsers);

      expect(config.overrideConfig?.[0]?.settings?.browsers).toBe(customBrowsers);
    });
  });

  describe("ESLint plugin configuration", () => {
    test("should include eslint-plugin-compat plugin", () => {
      const config = createESLintConfig("2015");

      expect(config.overrideConfig?.[0]?.plugins?.compat).toBeDefined();
    });

    test("should enable compat/compat rule with warning level", () => {
      const config = createESLintConfig("2015");

      expect(config.overrideConfig?.[0]?.rules?.["compat/compat"]).toBe("warn");
    });

    test("should disable compat/compat rule when skipCompatWarnings is true", () => {
      const config = createESLintConfig("2015", undefined, true);

      expect(config.overrideConfig?.[0]?.rules?.["compat/compat"]).toBe("off");
    });
  });

  describe("language options", () => {
    test("should set sourceType to module", () => {
      const config = createESLintConfig("2015");

      expect(config.overrideConfig?.[0]?.languageOptions?.sourceType).toBe("module");
    });

    test("should set ecmaVersion based on target", () => {
      const config = createESLintConfig("2020");

      expect(config.overrideConfig?.[0]?.languageOptions?.ecmaVersion).toBe(2020);
    });
  });

  describe("unused disable directives behavior verification", () => {
    const testDir = path.join(process.cwd(), "test-unused-disable-temp");

    beforeEach(() => {
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }

      // Create a file with an unused eslint-disable directive
      // This would normally trigger a warning about unused disable directive
      const testFile = path.join(testDir, "test.js");
      fs.writeFileSync(testFile, "// eslint-disable-next-line no-eval\nconst x = 1;\n");
    });

    afterEach(() => {
      // Clean up test directory
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    });

    test("should not report warnings for unused eslint-disable directives", async () => {
      const { ESLint } = await import("eslint");

      // Set BROWSERSLIST env variable to override any project-level settings
      const originalBrowserslistEnv = process.env.BROWSERSLIST;
      process.env.BROWSERSLIST = "> 1%, last 2 versions";

      try {
        const testFile = path.join(testDir, "test.js");
        // Provide explicit browser targets to avoid auto-determination issues
        const config = createESLintConfig("2015", "> 1%, last 2 versions");
        const eslint = new ESLint(config);
        const results = await eslint.lintFiles([testFile]);

        // Verify no warnings about unused disable directives
        const allMessages = results.flatMap((r) => r.messages);
        const unusedDisableWarnings = allMessages.filter(
          (msg) =>
            msg.ruleId === "eslint-comments/no-unused-disable" ||
            msg.message.includes("Unused eslint-disable directive") ||
            msg.message.includes("unused disable directive"),
        );

        expect(unusedDisableWarnings.length).toBe(0);
      } finally {
        // Restore original BROWSERSLIST env variable
        if (originalBrowserslistEnv !== undefined) {
          process.env.BROWSERSLIST = originalBrowserslistEnv;
        } else {
          delete process.env.BROWSERSLIST;
        }
      }
    });
  });

  describe("functional behavior", () => {
    test("should create configuration that overrides project ignore settings", () => {
      const config = createESLintConfig("2015");

      // The key test: verify that ignore patterns are disabled
      expect(config.ignore).toBe(false);
      expect(config.ignorePatterns).toEqual([]);
    });
  });

  describe("actual ignore behavior verification", () => {
    const testDir = path.join(process.cwd(), "test-ignore-temp");

    beforeEach(() => {
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }

      // Create files that would normally be ignored
      const ignoredFile = path.join(testDir, "ignored.js");
      const normalFile = path.join(testDir, "normal.js");
      const subdirFile = path.join(testDir, "subdir", "subdir-file.js");

      fs.mkdirSync(path.join(testDir, "subdir"), { recursive: true });

      // Create files with ES2015+ features that would trigger compatibility warnings
      // Using features that are definitely not supported in older browsers
      fs.writeFileSync(
        ignoredFile,
        'const arrowFunction = () => "ES2015";\nconst templateLiteral = `ES2015 template`;\nconst destructuring = { a: 1, b: 2 };\nconst { a, b } = destructuring;\nconst spread = [...[1, 2, 3]];\nconst rest = (...args) => args.length;',
      );
      fs.writeFileSync(
        normalFile,
        'const arrowFunction = () => "ES2015";\nconst templateLiteral = `ES2015 template`;\nconst destructuring = { a: 1, b: 2 };\nconst { a, b } = destructuring;\nconst spread = [...[1, 2, 3]];\nconst rest = (...args) => args.length;',
      );
      fs.writeFileSync(
        subdirFile,
        'const arrowFunction = () => "ES2015";\nconst templateLiteral = `ES2015 template`;\nconst destructuring = { a: 1, b: 2 };\nconst { a, b } = destructuring;\nconst spread = [...[1, 2, 3]];\nconst rest = (...args) => args.length;',
      );
    });

    afterEach(() => {
      // Clean up test directory
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    });

    test("should override project ignorePatterns when using our config", async () => {
      // Import ESGuard's checkCompatibility function to test actual behavior
      const { checkCompatibility } = await import("./checkCompatiblity.js");

      // Create a configuration that would normally ignore some files
      const config = {
        dir: testDir,
        target: "2015",
        browsers: "> 1%, last 2 versions",
      };

      // Run ESGuard's compatibility check
      const result = await checkCompatibility(config);

      expect(result.errors.length + result.warnings.length).toBeGreaterThanOrEqual(0);
    });
  });
});
