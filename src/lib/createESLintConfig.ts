import type { ESLint, Linter } from "eslint";
import compat from "eslint-plugin-compat";

import { getBrowserTargetsFromString, parseEcmaVersion } from "./getBrowserTargets.js";
import { isValidEcmaVersion } from "./isValidEcmaVersion.js";

const getEcmaVersion = (target: string): Linter.EcmaVersion => {
  const ecmaVersion = parseEcmaVersion(target);

  if (!isValidEcmaVersion(ecmaVersion)) {
    throw new Error(`Invalid ECMAScript version: ${ecmaVersion}. Target year ${target} is not supported.`);
  }

  return ecmaVersion as Linter.EcmaVersion;
};

/**
 * Creates an ESLint configuration that ignores project-level ignore patterns.
 * This ensures that es-guard can scan ALL files in the target directory,
 * including those that would normally be excluded by .eslintignore or other project settings.
 */
export const createESLintConfig = (target: string, browsers?: string, skipCompatWarnings?: boolean): ESLint.Options => {
  // Convert target year to ECMAScript version number using the validation function
  const ecmaVersion = getEcmaVersion(target);

  // Use provided browsers or auto-determine from target
  const browserTargets = browsers || getBrowserTargetsFromString(target);

  return {
    overrideConfigFile: true,
    // Disable ignore patterns to ensure we scan ALL files in the target directory
    ignore: false,
    // Override any project-level ignore settings
    ignorePatterns: [],
    overrideConfig: [
      {
        // Disable inline config comments (eslint-disable, etc.)
        // This prevents ESLint from processing disable directives for rules not in our config
        linterOptions: {
          reportUnusedDisableDirectives: false,
          noInlineConfig: true,
        },
        plugins: {
          compat,
        },
        rules: {
          "compat/compat": skipCompatWarnings ? "off" : "warn",
        },
        languageOptions: {
          ecmaVersion: ecmaVersion,
          sourceType: "module",
        },
        settings: {
          browsers: browserTargets,
        },
      },
    ],
  };
};
