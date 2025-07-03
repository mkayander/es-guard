import * as fs from "fs";
import * as path from "path";

/**
 * Detects ES target from common frontend project configuration files.
 * Searches in order of preference: package.json, tsconfig.json, babel.config.js, .babelrc, vite.config.js, webpack.config.js
 */
export const detectTarget = (cwd: string = process.cwd()): string | null => {
  const configFiles = [
    { name: "package.json", parser: parsePackageJson },
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
          return target;
        }
      } catch (error) {
        // Continue to next config file if parsing fails
        continue;
      }
    }
  }

  return null;
};

/**
 * Parse package.json for ES target in browserslist or engines
 */
const parsePackageJson = (filePath: string): string | null => {
  const content = fs.readFileSync(filePath, "utf-8");
  const pkg = JSON.parse(content);

  // Check for browserslist field
  if (pkg.browserslist) {
    const browserslist = Array.isArray(pkg.browserslist) ? pkg.browserslist : [pkg.browserslist];

    // Look for ES target in browserslist
    for (const browser of browserslist) {
      if (typeof browser === "string") {
        // Handle both es6 and es2020 formats
        const esMatch = browser.match(/es(\d+)/i);
        if (esMatch) {
          const esVersion = parseInt(esMatch[1]);
          // If it's a 4-digit year (like 2020), use it directly
          if (esVersion >= 2000) {
            return esVersion.toString();
          }
          // Otherwise convert ES version to year: ES6=2015, ES7=2016, ES8=2017, etc.
          return (2009 + esVersion).toString();
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
  const content = fs.readFileSync(filePath, "utf-8");
  const config = JSON.parse(content);

  if (config.compilerOptions?.target) {
    const target = config.compilerOptions.target;
    // Convert TypeScript target to ES year
    const targetMap: Record<string, string> = {
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
    };

    return targetMap[target] || null;
  }

  return null;
};

/**
 * Parse babel.config.js for preset-env target
 */
const parseBabelConfig = (filePath: string): string | null => {
  const content = fs.readFileSync(filePath, "utf-8");

  // Look for @babel/preset-env configuration
  const presetEnvMatch = content.match(/@babel\/preset-env.*?targets.*?(\{[^}]*\})/s);
  if (presetEnvMatch) {
    const targetsStr = presetEnvMatch[1];

    // Look for browsers or esmodules target
    const browsersMatch = targetsStr.match(/browsers.*?\[(.*?)\]/);
    if (browsersMatch) {
      const browsers = browsersMatch[1];
      const esMatch = browsers.match(/es(\d+)/i);
      if (esMatch) {
        const esVersion = parseInt(esMatch[1]);
        // If it's a 4-digit year (like 2020), use it directly
        if (esVersion >= 2000) {
          return esVersion.toString();
        }
        // Otherwise convert ES version to year: ES6=2015, ES7=2016, ES8=2017, etc.
        return (2009 + esVersion).toString();
      }
    }
  }

  return null;
};

/**
 * Parse .babelrc for preset-env target
 */
const parseBabelRc = (filePath: string): string | null => {
  const content = fs.readFileSync(filePath, "utf-8");
  const config = JSON.parse(content);

  if (config.presets) {
    for (const preset of config.presets) {
      if (Array.isArray(preset) && preset[0] === "@babel/preset-env") {
        const options = preset[1];
        if (options?.targets?.browsers) {
          const browsers = options.targets.browsers;
          for (const browser of browsers) {
            const esMatch = browser.match(/es(\d+)/i);
            if (esMatch) {
              const esVersion = parseInt(esMatch[1]);
              // If it's a 4-digit year (like 2020), use it directly
              if (esVersion >= 2000) {
                return esVersion.toString();
              }
              // Otherwise convert ES version to year: ES6=2015, ES7=2016, ES8=2017, etc.
              return (2009 + esVersion).toString();
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
  const content = fs.readFileSync(filePath, "utf-8");

  // Look for esbuild target - more flexible pattern
  const esbuildMatch = content.match(/esbuild\s*:\s*\{[^}]*target\s*:\s*['"`]([^'"`]+)['"`]/s);
  if (esbuildMatch) {
    const target = esbuildMatch[1];
    const targetMap: Record<string, string> = {
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

    return targetMap[target] || null;
  }

  return null;
};

/**
 * Parse webpack.config.js/ts for target
 */
const parseWebpackConfig = (filePath: string): string | null => {
  const content = fs.readFileSync(filePath, "utf-8");

  // Look for target configuration
  const targetMatch = content.match(/target.*?['"`]([^'"`]+)['"`]/);
  if (targetMatch) {
    const target = targetMatch[1];
    const targetMap: Record<string, string> = {
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

    return targetMap[target] || null;
  }

  return null;
};
