import { describe, expect, test } from "vitest";

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

  describe("functional behavior", () => {
    test("should create configuration that overrides project ignore settings", () => {
      const config = createESLintConfig("2015");

      // The key test: verify that ignore patterns are disabled
      expect(config.ignore).toBe(false);
      expect(config.ignorePatterns).toEqual([]);
    });
  });
});
