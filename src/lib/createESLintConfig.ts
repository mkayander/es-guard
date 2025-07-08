import { ESLint, Linter } from "eslint";
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

export const createESLintConfig = (target: string, browsers?: string): ESLint.Options => {
  // Convert target year to ECMAScript version number using the validation function
  const ecmaVersion = getEcmaVersion(target);

  // Use provided browsers or auto-determine from target
  const browserTargets = browsers || getBrowserTargetsFromString(target);

  return {
    overrideConfigFile: true,
    overrideConfig: [
      {
        plugins: {
          compat,
        },
        rules: {
          "compat/compat": "warn",
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
