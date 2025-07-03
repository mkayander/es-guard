import * as fs from "fs";
import * as path from "path";

// Shared utilities for ES version parsing and conversion

/**
 * Parse ES version from string (e.g., "es6", "es2020", "ES2015")
 * Returns the year as a string, or null if not found
 */
const parseESVersion = (str: string): string | null => {
  const esMatch = str.match(/es(\d+)/i);
  if (esMatch) {
    const esVersion = parseInt(esMatch[1]);
    // If it's a 4-digit year (like 2020), use it directly
    if (esVersion >= 2000) {
      return esVersion.toString();
    }
    // Otherwise convert ES version to year: ES6=2015, ES7=2016, ES8=2017, etc.
    return (2009 + esVersion).toString();
  }
  return null;
};

/**
 * Common target mapping for TypeScript, Vite, and Webpack configs
 */
const TARGET_MAP: Record<string, string> = {
  // TypeScript targets
  ES2022: "2022",
  ES2021: "2021",
  ES2020: "2020",
  ES2019: "2019",
  ES2018: "2018",
  ES2017: "2017",
  ES2016: "2016",
  ES2015: "2015",
  ES6: "2015",
  ES5: "2009",
  ES3: "1999",
  // Vite/Webpack targets (lowercase)
  es2022: "2022",
  es2021: "2021",
  es2020: "2020",
  es2019: "2019",
  es2018: "2018",
  es2017: "2017",
  es2016: "2016",
  es2015: "2015",
  es6: "2015",
  es5: "2009",
};

/**
 * Helper to read and parse JSON file safely
 */
const readJsonFile = (filePath: string): unknown => {
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
};

/**
 * Type guard for package.json structure
 */
const isPackageJson = (obj: unknown): obj is { browserslist?: string | string[] } => {
  return typeof obj === "object" && obj !== null && "browserslist" in obj;
};

/**
 * Type guard for tsconfig.json structure
 */
const isTsConfig = (obj: unknown): obj is { compilerOptions?: { target?: string } } => {
  return typeof obj === "object" && obj !== null && "compilerOptions" in obj;
};

/**
 * Type guard for .babelrc structure
 */
const isBabelRc = (obj: unknown): obj is { presets?: Array<[string, { targets?: { browsers?: string[] } }]> } => {
  return typeof obj === "object" && obj !== null && "presets" in obj;
};

/**
 * Helper to read text file safely
 */
const readTextFile = (filePath: string): string => {
  return fs.readFileSync(filePath, "utf-8");
};

/**
 * Detects ES target from common frontend project configuration files.
 * Searches in order of preference: package.json, .browserslistrc/.browserslist, tsconfig.json, babel.config.js, .babelrc, vite.config.js, webpack.config.js
 * Returns an object with the detected target and the source file name, or null if not found
 */
export const detectTarget = (cwd: string = process.cwd()): { target: string; source: string } | null => {
  const configFiles = [
    { name: "package.json", parser: parsePackageJson },
    { name: ".browserslistrc", parser: parseBrowserslistFile },
    { name: ".browserslist", parser: parseBrowserslistFile },
    { name: "tsconfig.json", parser: parseTsConfig },
    { name: "babel.config.js", parser: parseBabelConfig },
    { name: ".babelrc", parser: parseBabelRc },
    { name: "vite.config.js", parser: parseViteConfig },
    { name: "vite.config.ts", parser: parseViteConfig },
    { name: "webpack.config.js", parser: parseWebpackConfig },
    { name: "webpack.config.ts", parser: parseWebpackConfig },
  ];

  for (const config of configFiles) {
    const filePath = path.join(cwd, config.name);
    if (fs.existsSync(filePath)) {
      try {
        const target = config.parser(filePath);
        if (target) {
          return { target, source: config.name };
        }
      } catch (error) {
        console.warn(`Error parsing ${config.name}:`, error);
        // Continue to next config file if parsing fails
        continue;
      }
    }
  }

  return null;
};

/**
 * Parse package.json for ES target in browserslist
 */
const parsePackageJson = (filePath: string): string | null => {
  const pkg = readJsonFile(filePath);

  if (!isPackageJson(pkg)) {
    console.warn(
      `Warning: ${filePath} does not look like a valid package.json (missing or invalid browserslist field).`,
    );
    return null;
  }

  // Check for browserslist field
  if (pkg.browserslist) {
    const browserslist = Array.isArray(pkg.browserslist) ? pkg.browserslist : [pkg.browserslist];

    // Look for ES target in browserslist
    for (const browser of browserslist) {
      if (typeof browser === "string") {
        const target = parseESVersion(browser);
        if (target) {
          return target;
        }
      }
    }
  }

  // Note: engines.node is for development/build tools, not client-side targets
  // So we don't use it for auto-detection

  return null;
};

/**
 * Parse tsconfig.json for target
 */
const parseTsConfig = (filePath: string): string | null => {
  const config = readJsonFile(filePath);

  if (!isTsConfig(config)) {
    console.warn(
      `Warning: ${filePath} does not look like a valid tsconfig.json (missing or invalid compilerOptions field).`,
    );
    return null;
  }

  if (config.compilerOptions?.target) {
    const target = config.compilerOptions.target;
    return TARGET_MAP[target] || null;
  }

  return null;
};

/**
 * Parse babel.config.js for preset-env target
 */
const parseBabelConfig = (filePath: string): string | null => {
  const content = readTextFile(filePath);

  // Look for @babel/preset-env configuration
  const presetEnvMatch = content.match(/@babel\/preset-env.*?targets.*?(\{[^}]*\})/s);
  if (presetEnvMatch) {
    const targetsStr = presetEnvMatch[1];

    // Look for browsers or esmodules target
    const browsersMatch = targetsStr.match(/browsers.*?\[(.*?)\]/);
    if (browsersMatch) {
      const browsers = browsersMatch[1];
      return parseESVersion(browsers);
    }
  }

  return null;
};

/**
 * Parse .babelrc for preset-env target
 */
const parseBabelRc = (filePath: string): string | null => {
  const config = readJsonFile(filePath);

  if (!isBabelRc(config)) {
    console.warn(`Warning: ${filePath} does not look like a valid .babelrc (missing or invalid presets field).`);
    return null;
  }

  if (config.presets) {
    for (const preset of config.presets) {
      if (Array.isArray(preset) && preset[0] === "@babel/preset-env") {
        const options = preset[1];
        if (options?.targets?.browsers) {
          const browsers = options.targets.browsers;
          for (const browser of browsers) {
            const target = parseESVersion(browser);
            if (target) {
              return target;
            }
          }
        }
      }
    }
  }

  return null;
};

/**
 * Parse vite.config.js/ts for target
 */
const parseViteConfig = (filePath: string): string | null => {
  const content = readTextFile(filePath);

  // Look for esbuild target - more flexible pattern
  const esbuildMatch = content.match(/esbuild\s*:\s*\{[^}]*target\s*:\s*['"`]([^'"`]+)['"`]/s);
  if (esbuildMatch) {
    const target = esbuildMatch[1];
    return TARGET_MAP[target] || null;
  }

  return null;
};

/**
 * Parse webpack.config.js/ts for target
 */
const parseWebpackConfig = (filePath: string): string | null => {
  const content = readTextFile(filePath);

  // Look for target configuration
  const targetMatch = content.match(/target.*?['"`]([^'"`]+)['"`]/);
  if (targetMatch) {
    const target = targetMatch[1];
    return TARGET_MAP[target] || null;
  }

  return null;
};

/**
 * Parse .browserslistrc or .browserslist file for ES target
 */
const parseBrowserslistFile = (filePath: string): string | null => {
  const content = readTextFile(filePath);
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  for (const browser of lines) {
    const target = parseESVersion(browser);
    if (target) {
      return target;
    }
  }

  return null;
};
