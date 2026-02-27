import * as fs from "fs";
import * as path from "path";
import stripJsonComments from "strip-json-comments";

/**
 * Helper to read and parse JSON file safely.
 * Supports JSON with comments (e.g. tsconfig.json).
 */
export const readJsonFile = (filePath: string): unknown => {
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(stripJsonComments(content, { trailingCommas: true }));
};

/**
 * Helper to read text file safely
 */
export const readTextFile = (filePath: string): string => {
  return fs.readFileSync(filePath, "utf-8");
};

/**
 * Helper to safely evaluate JavaScript files (for config files)
 */
export const evaluateJsFile = (filePath: string): unknown => {
  const content = readTextFile(filePath);
  // Create a safe evaluation context
  const module = { exports: {} };
  const require = (id: string) => {
    if (id === "path") return path;
    if (id === "fs") return fs;
    throw new Error(`Cannot require '${id}' in config evaluation`);
  };

  try {
    // Use Function constructor to create a safe evaluation environment
    const fn = new Function("module", "exports", "require", "path", "fs", "__dirname", content);
    fn(module, module.exports, require, path, fs, path.dirname(filePath));
    return module.exports;
  } catch (error) {
    console.warn(`Error evaluating ${filePath}:`, error);
    return null;
  }
};

/**
 * Type guard for package.json structure
 */
export const isPackageJson = (
  obj: unknown,
): obj is {
  browserslist?: string | string[];
  main?: string;
  dist?: string;
  build?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
} => {
  return typeof obj === "object" && obj !== null;
};

/**
 * Type guard for tsconfig.json structure
 */
export const isTsConfig = (
  obj: unknown,
): obj is {
  compilerOptions?: {
    target?: string;
    outDir?: string;
  };
} => {
  return typeof obj === "object" && obj !== null && "compilerOptions" in obj;
};

/**
 * Type guard for .babelrc structure
 */
export const isBabelRc = (
  obj: unknown,
): obj is { presets?: Array<[string, { targets?: { browsers?: string[] } }]> } => {
  return typeof obj === "object" && obj !== null && "presets" in obj;
};

/**
 * Type guard for vite config structure
 */
export const isViteConfig = (
  obj: unknown,
): obj is {
  build?: {
    outDir?: string;
  };
} => {
  return typeof obj === "object" && obj !== null;
};

/**
 * Type guard for webpack config structure
 */
export const isWebpackConfig = (
  obj: unknown,
): obj is {
  output?: {
    path?: string;
  };
} => {
  return typeof obj === "object" && obj !== null;
};

/**
 * Type guard for next.js config structure
 */
export const isNextConfig = (
  obj: unknown,
): obj is {
  distDir?: string;
} => {
  return typeof obj === "object" && obj !== null;
};
