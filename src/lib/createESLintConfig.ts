import { ESLint, Linter } from "eslint";
import compat from "eslint-plugin-compat";

const isValidEcmaVersion = (ecmaVersion: number): boolean => {
  return ecmaVersion >= 3 && ecmaVersion <= 2025;
};

const getEcmaVersion = (target: string): Linter.EcmaVersion => {
  const ecmaVersion = parseInt(target) - 2009; // ES2015 = 6, ES2020 = 11, etc.

  if (!isValidEcmaVersion(ecmaVersion)) {
    throw new Error(
      `Invalid ECMAScript version: ${ecmaVersion}. Target year ${target} is not supported.`
    );
  }

  return ecmaVersion as Linter.EcmaVersion;
};

export const createESLintConfig = (
  target: string,
  browsers: string
): ESLint.Options => {
  // Convert target year to ECMAScript version number using the validation function
  const ecmaVersion = getEcmaVersion(target);

  return {
    overrideConfigFile: true,
    overrideConfig: [
      {
        plugins: {
          compat,
        },
        rules: {
          "compat/compat": "error",
        },
        languageOptions: {
          ecmaVersion: ecmaVersion,
          sourceType: "module",
        },
        settings: {
          browsers: browsers,
        },
      },
    ],
  };
};
