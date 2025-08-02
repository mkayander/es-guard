import * as fs from "fs";
import * as path from "path";
import { verboseMode } from "./globalState.js";
import { NEXTJS_DEFAULT_BROWSERSLIST, getDefaultOutputDir } from "./defaults.js";
import { detectAndCacheProjectType, getCurrentProjectType } from "./projectType.js";
import {
  readJsonFile,
  readTextFile,
  evaluateJsFile,
  isPackageJson,
  isTsConfig,
  isBabelRc,
  isViteConfig,
  isWebpackConfig,
  isNextConfig,
} from "./utils.js";

// Shared utilities for ES version parsing and conversion

const CONFIG_FILE_NAMES = [
  "package.json",
  ".browserslistrc",
  ".browserslist",
  "tsconfig.json",
  "babel.config.js",
  "babel.config.cjs",
  "babel.config.mjs",
  ".babelrc",
  "vite.config.js",
  "vite.config.ts",
  "vite.config.cjs",
  "vite.config.mjs",
  "webpack.config.js",
  "webpack.config.ts",
  "webpack.config.cjs",
  "webpack.config.mjs",
  "next.config.js",
  "next.config.ts",
  "next.config.cjs",
  "next.config.mjs",
];

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
 * Parser result type for individual config files
 */
type ParserResult = {
  target?: string;
  outputDir?: string;
  outputSource?: string;
  browserslist?: string[];
  browserslistSource?: string;
};

/**
 * Detection result type for all project configuration
 */
type DetectionResult = {
  target?: string;
  targetSource?: string;
  outputDir?: string;
  outputSource?: string;
  browserslist?: string[];
  browserslistSource?: string;
};

/**
 * Get parser function for a given config file
 */
const getParser = (filename: string) => {
  switch (true) {
    case filename === "package.json":
      return parsePackageJson;
    case filename === ".browserslistrc":
    case filename === ".browserslist":
      return parseBrowserslistFile;
    case filename === "tsconfig.json":
      return parseTsConfig;
    case filename === ".babelrc":
      return parseBabelRc;
    case filename.startsWith("babel.config"):
      return parseBabelConfig;
    case filename.startsWith("vite.config"):
      return parseViteConfig;
    case filename.startsWith("webpack.config"):
      return parseWebpackConfig;
    case filename.startsWith("next.config"):
      return parseNextConfig;
    default:
      return null;
  }
};

/**
 * Get all possible config file names for detection
 */
export const getConfigFileNames = () => {
  return CONFIG_FILE_NAMES;
};

/**
 * Detection function that extracts all configuration in a single pass
 * This is more efficient than separate detection functions
 */
export const detectProjectConfig = (cwd: string = process.cwd()): DetectionResult => {
  const configFileNames = getConfigFileNames();
  const result: DetectionResult = {};

  if (verboseMode) {
    console.log("🔍 Starting configuration detection...");
    console.log(`📂 Scanning directory: ${cwd}`);
    console.log("📋 Files to check:");
    configFileNames.forEach((filename, index) => {
      console.log(`   ${index + 1}. ${filename}`);
    });
    console.log("");
  }

  for (const filename of configFileNames) {
    const filePath = path.join(cwd, filename);

    if (fs.existsSync(filePath)) {
      if (verboseMode) {
        console.log(`✅ Found: ${filename}`);
      }

      const parser = getParser(filename);
      if (!parser) {
        if (verboseMode) {
          console.log(`   ⚠️  No parser available for ${filename}`);
        } else {
          console.warn(`No parser found for ${filename}`);
        }
        continue;
      }

      try {
        const detection = parser(filePath);

        if (verboseMode) {
          console.log(`   📄 Parsed ${filename}:`);
        }

        // Update target if found and not already set
        if (detection.target && !result.target) {
          result.target = detection.target;
          result.targetSource = filename;
          if (verboseMode) {
            console.log(`      🎯 Target: ${detection.target} (ES${detection.target})`);
          }
        } else if (verboseMode && detection.target) {
          console.log(`      🎯 Target: ${detection.target} (already found in ${result.targetSource})`);
        } else if (verboseMode) {
          console.log(`      🎯 Target: not found`);
        }

        // Update output directory if found and not already set
        if (detection.outputDir && !result.outputDir) {
          result.outputDir = detection.outputDir;
          result.outputSource = detection.outputSource || filename;
          if (verboseMode) {
            console.log(`      📁 Output directory: ${detection.outputDir}`);
          }
        } else if (verboseMode && detection.outputDir) {
          console.log(`      📁 Output directory: ${detection.outputDir} (already found in ${result.outputSource})`);
        } else if (verboseMode) {
          console.log(`      📁 Output directory: not found`);
        }

        // Update browserslist if found and not already set
        if (detection.browserslist && !result.browserslist) {
          result.browserslist = detection.browserslist;
          result.browserslistSource = detection.browserslistSource || filename;
          if (verboseMode) {
            console.log(
              `      🌐 Browserslist: ${detection.browserslist.join(", ")} (from ${result.browserslistSource})`,
            );
          }
        } else if (verboseMode && detection.browserslist) {
          console.log(
            `      🌐 Browserslist: ${detection.browserslist.join(", ")} (already found in ${result.browserslistSource})`,
          );
        } else if (verboseMode) {
          console.log(`      🌐 Browserslist: not found`);
        }

        // If we found all three (target, output directory, and browserslist), we can stop searching
        if (result.target && result.outputDir && result.browserslist) {
          if (verboseMode) {
            console.log(`   ✅ All configuration found, stopping search`);
          }
          break;
        }
      } catch (error) {
        if (verboseMode) {
          console.log(`   ❌ Error parsing ${filename}: ${error instanceof Error ? error.message : String(error)}`);
        } else {
          console.warn(`Error parsing ${filename}:`, error);
        }
        continue;
      }
    } else if (verboseMode) {
      console.log(`❌ Not found: ${filename}`);
    }
  }

  if (verboseMode) {
    console.log("");
    console.log("📊 Detection Results:");
    if (result.target) {
      console.log(`   🎯 Target: ${result.target} (from ${result.targetSource})`);
    } else {
      console.log(`   🎯 Target: not found`);
    }

    if (result.outputDir) {
      console.log(`   📁 Output directory: ${result.outputDir} (from ${result.outputSource})`);
    } else {
      console.log(`   📁 Output directory: not found`);
    }

    if (result.browserslist) {
      console.log(`   🌐 Browserslist: ${result.browserslist.join(", ")} (from ${result.browserslistSource})`);
    } else {
      console.log(`   🌐 Browserslist: not found`);
    }
    console.log("");
  }

  return result;
};

/**
 * Legacy function for backward compatibility - detects only ES target
 */
export const detectTarget = (cwd: string = process.cwd()): { target: string; source: string } | null => {
  const result = detectProjectConfig(cwd);
  return result.target ? { target: result.target, source: result.targetSource! } : null;
};

/**
 * Legacy function for backward compatibility - detects only output directory
 */
export const detectOutputDir = (cwd: string = process.cwd()): { outputDir: string; source: string } | null => {
  const result = detectProjectConfig(cwd);
  return result.outputDir ? { outputDir: result.outputDir, source: result.outputSource! } : null;
};

/**
 * Legacy function for backward compatibility - detects only browserslist
 */
export const detectBrowserslist = (cwd: string = process.cwd()): { browserslist: string[]; source: string } | null => {
  const result = detectProjectConfig(cwd);
  return result.browserslist ? { browserslist: result.browserslist, source: result.browserslistSource! } : null;
};

/**
 * Legacy function for backward compatibility - detects target and output directory
 */
export const detectTargetAndOutput = (cwd: string = process.cwd()): DetectionResult => {
  const result = detectProjectConfig(cwd);
  return {
    target: result.target,
    targetSource: result.targetSource,
    outputDir: result.outputDir,
    outputSource: result.outputSource,
    browserslist: result.browserslist,
    browserslistSource: result.browserslistSource,
  };
};

/**
 * Parse package.json for both target and output directory
 */
const parsePackageJson = (filePath: string): ParserResult => {
  const pkg = readJsonFile(filePath);

  if (!isPackageJson(pkg)) {
    console.warn(
      `Warning: ${filePath} does not look like a valid package.json (missing or invalid browserslist field).`,
    );
    return {};
  }

  const result: ParserResult = {};

  // Check for browserslist field
  if (pkg.browserslist) {
    const browserslist = Array.isArray(pkg.browserslist) ? pkg.browserslist : [pkg.browserslist];

    // Store the full browserslist for CLI defaults
    result.browserslist = browserslist.filter((browser) => typeof browser === "string");
  }

  // Use global project type detection (lazy initialization)
  const projectType = getCurrentProjectType(path.dirname(filePath));

  // Check for output directory hints
  if (pkg.dist) {
    result.outputDir = pkg.dist;
  } else if (pkg.build) {
    result.outputDir = pkg.build;
  } else if (pkg.main && pkg.main.startsWith("./dist/")) {
    result.outputDir = "dist";
  } else if (projectType === "nextjs") {
    // Set default output directory for Next.js projects
    result.outputDir = ".next/static";
    result.outputSource = "package.json (default)";
  }

  // If no browserslist was found, use default for detected project type
  if (!result.browserslist && projectType === "nextjs") {
    result.browserslist = [...NEXTJS_DEFAULT_BROWSERSLIST];
    result.browserslistSource = "Next.js default";
  }

  return result;
};

/**
 * Parse tsconfig.json for both target and output directory
 */
const parseTsConfig = (filePath: string): ParserResult => {
  const config = readJsonFile(filePath);

  if (!isTsConfig(config)) {
    console.warn(
      `Warning: ${filePath} does not look like a valid tsconfig.json (missing or invalid compilerOptions field).`,
    );
    return {};
  }

  const result: ParserResult = {};

  if (config.compilerOptions?.target) {
    const target = config.compilerOptions.target;
    const mappedTarget = TARGET_MAP[target];
    if (mappedTarget) {
      result.target = mappedTarget;
    }
  }

  if (config.compilerOptions?.outDir) {
    result.outputDir = config.compilerOptions.outDir;
  }

  return result;
};

/**
 * Parse babel.config.js for target
 */
const parseBabelConfig = (filePath: string): ParserResult => {
  const content = readTextFile(filePath);

  const result: ParserResult = {};

  // Look for @babel/preset-env configuration
  const presetEnvMatch = content.match(/@babel\/preset-env.*?targets.*?(\{[^}]*\})/s);
  if (presetEnvMatch) {
    const targetsStr = presetEnvMatch[1];

    // Look for browsers or esmodules target
    const browsersMatch = targetsStr.match(/browsers.*?\[(.*?)\]/);
    if (browsersMatch) {
      const browsers = browsersMatch[1];
      // Parse browsers array from string
      const browsersList = browsers
        .split(",")
        .map((b) => b.trim().replace(/['"]/g, ""))
        .filter((b) => b);

      // Store the full browserslist for CLI defaults
      result.browserslist = browsersList;
    }
  }

  return result;
};

/**
 * Parse .babelrc for target
 */
const parseBabelRc = (filePath: string): ParserResult => {
  const config = readJsonFile(filePath);

  if (!isBabelRc(config)) {
    console.warn(`Warning: ${filePath} does not look like a valid .babelrc (missing or invalid presets field).`);
    return {};
  }

  const result: ParserResult = {};

  if (config.presets) {
    for (const preset of config.presets) {
      if (Array.isArray(preset) && preset[0] === "@babel/preset-env") {
        const options = preset[1];
        if (options?.targets?.browsers) {
          const browsers = options.targets.browsers;
          // Store the full browserslist for CLI defaults
          result.browserslist = browsers;
        }
      }
    }
  }

  return result;
};

/**
 * Parse vite.config.js/ts for both target and output directory
 */
const parseViteConfig = (filePath: string): ParserResult => {
  const content = readTextFile(filePath);
  const config = evaluateJsFile(filePath);

  const result: { target?: string; outputDir?: string } = {};

  // Look for esbuild target
  const esbuildMatch = content.match(/esbuild\s*:\s*\{[^}]*target\s*:\s*['"`]([^'"`]+)['"`]/s);
  if (esbuildMatch) {
    const target = esbuildMatch[1];
    const mappedTarget = TARGET_MAP[target];
    if (mappedTarget) {
      result.target = mappedTarget;
    }
  }

  // Look for output directory
  if (isViteConfig(config) && config.build?.outDir) {
    result.outputDir = config.build.outDir;
  }

  return result;
};

/**
 * Parse webpack.config.js/ts for both target and output directory
 */
const parseWebpackConfig = (filePath: string): ParserResult => {
  const content = readTextFile(filePath);
  const config = evaluateJsFile(filePath);

  const result: { target?: string; outputDir?: string } = {};

  // Look for target configuration
  const targetMatch = content.match(/target.*?['"`]([^'"`]+)['"`]/);
  if (targetMatch) {
    const target = targetMatch[1];
    const mappedTarget = TARGET_MAP[target];
    if (mappedTarget) {
      result.target = mappedTarget;
    }
  }

  // Look for output directory
  if (isWebpackConfig(config) && config.output?.path) {
    // Extract just the directory name from the path
    const outputPath = config.output.path;
    const dirName = path.basename(outputPath);
    result.outputDir = dirName;
  }

  return result;
};

/**
 * Parse .browserslistrc or .browserslist file for browserslist
 */
const parseBrowserslistFile = (filePath: string): ParserResult => {
  const content = readTextFile(filePath);
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  const result: ParserResult = {};

  // Store the full browserslist for CLI defaults
  result.browserslist = lines;

  return result;
};

/**
 * Parse next.config.js/ts/cjs/mjs for output directory
 */
const parseNextConfig = (filePath: string): ParserResult => {
  const config = evaluateJsFile(filePath);

  if (!isNextConfig(config)) {
    return {};
  }

  const result: { target?: string; outputDir?: string } = {};

  // Next.js uses .next as default output directory
  if (config.distDir) {
    result.outputDir = config.distDir;
  } else {
    // Default Next.js output directory
    result.outputDir = ".next";
  }

  return result;
};
