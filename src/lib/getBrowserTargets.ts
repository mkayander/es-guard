import { Linter } from "eslint";

/**
 * Converts a string target to Linter.EcmaVersion type.
 * Handles year format (2015), numeric format (6), and "latest".
 * Returns null for unknown values to indicate they should use default.
 */
export const parseEcmaVersion = (target: string): Linter.EcmaVersion | null => {
  // Handle "latest"
  if (target === "latest") {
    return "latest";
  }

  const num = parseInt(target);

  // Handle year format (2015, 2016, etc.)
  if (num >= 2015 && num <= 2026) {
    return num as Linter.EcmaVersion;
  }

  // Handle numeric format (3, 5, 6, 7, etc.)
  if (num >= 3 && num <= 17) {
    return num as Linter.EcmaVersion;
  }

  // For unknown values, return null to indicate default should be used
  return null;
};

/**
 * Maps ES target versions to appropriate browser targets for compatibility checking.
 * This provides sensible defaults based on when ES features were widely supported.
 */
export const getBrowserTargets = (target?: Linter.EcmaVersion | null): string => {
  switch (target) {
    // Legacy versions
    case 3:
      return "> 0.1%, ie 6";
    case 5:
      return "> 0.5%, ie 8";

    // ES2015 (ES6) - Conservative targets including IE11
    case 6:
    case 2015:
      return "> 1%, last 2 versions, not dead, ie 11";

    // ES2016-2017 (ES7-8) - Drop IE11 but keep other older browsers
    case 7:
    case 8:
    case 2016:
    case 2017:
      return "> 1%, last 2 versions, not dead, not ie 11";

    // ES2018-2019 (ES9-10) - More modern browsers
    case 9:
    case 10:
    case 2018:
    case 2019:
      return "> 1%, last 2 versions, not dead, not ie 11, not op_mini all";

    // ES2020+ (ES11+) - Latest browsers with good modern JS support
    case 11:
    case 12:
    case 13:
    case 14:
    case 15:
    case 16:
    case 17:
    case 2020:
    case 2021:
    case 2022:
    case 2023:
    case 2024:
    case 2025:
    case 2026:
    case "latest":
      return "> 1%, last 2 versions, not dead, not ie 11, not op_mini all, not android < 67";

    // Default fallback for unknown versions
    default:
      return "> 1%, last 2 versions, not dead";
  }
};

/**
 * Convenience function that combines parsing and browser target determination.
 * Accepts string input and returns appropriate browser targets.
 */
export const getBrowserTargetsFromString = (target: string): string => {
  const ecmaVersion = parseEcmaVersion(target);

  return getBrowserTargets(ecmaVersion);
};
