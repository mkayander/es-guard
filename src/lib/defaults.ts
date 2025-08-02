/**
 * Default configurations for different project types
 */

/**
 * Next.js default browserslist configuration
 * Source: https://nextjs.org/docs/basic-features/supported-browsers-features
 */
export const NEXTJS_DEFAULT_BROWSERSLIST = ["chrome 64", "edge 79", "firefox 67", "opera 51", "safari 12"] as const;

/**
 * Default output directories for different project types
 */
export const DEFAULT_OUTPUT_DIRS = {
  NEXTJS: ".next/static",
  VITE: "dist",
  WEBPACK: "dist",
  ROLLUP: "dist",
  PARCEL: "dist",
  GENERIC: "dist",
} as const;

/**
 * Project type detection helpers
 */
export const PROJECT_TYPES = {
  NEXTJS: "nextjs",
  VITE: "vite",
  WEBPACK: "webpack",
  ROLLUP: "rollup",
  PARCEL: "parcel",
  GENERIC: "generic",
} as const;

/**
 * Get default browserslist for a project type
 */
export function getDefaultBrowserslist(projectType: string): string[] | null {
  switch (projectType) {
    case PROJECT_TYPES.NEXTJS:
      return [...NEXTJS_DEFAULT_BROWSERSLIST];
    // Add more project types here as needed
    default:
      return null;
  }
}

/**
 * Get default output directory for a project type
 */
export function getDefaultOutputDir(projectType: string): string | null {
  switch (projectType) {
    case PROJECT_TYPES.NEXTJS:
      return DEFAULT_OUTPUT_DIRS.NEXTJS;
    case PROJECT_TYPES.VITE:
      return DEFAULT_OUTPUT_DIRS.VITE;
    case PROJECT_TYPES.WEBPACK:
      return DEFAULT_OUTPUT_DIRS.WEBPACK;
    case PROJECT_TYPES.ROLLUP:
      return DEFAULT_OUTPUT_DIRS.ROLLUP;
    case PROJECT_TYPES.PARCEL:
      return DEFAULT_OUTPUT_DIRS.PARCEL;
    default:
      return DEFAULT_OUTPUT_DIRS.GENERIC;
  }
}

/**
 * Detect project type from package.json dependencies
 */
export function detectProjectType(
  dependencies: Record<string, string> = {},
  devDependencies: Record<string, string> = {},
): string {
  const allDeps = { ...dependencies, ...devDependencies };

  if (allDeps.next) {
    return PROJECT_TYPES.NEXTJS;
  }
  if (allDeps.vite) {
    return PROJECT_TYPES.VITE;
  }
  if (allDeps.webpack) {
    return PROJECT_TYPES.WEBPACK;
  }
  if (allDeps.rollup) {
    return PROJECT_TYPES.ROLLUP;
  }
  if (allDeps.parcel) {
    return PROJECT_TYPES.PARCEL;
  }

  return PROJECT_TYPES.GENERIC;
}
