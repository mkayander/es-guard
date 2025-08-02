/**
 * Default configurations for different project types
 */

import type { ProjectType } from "./types.js";

/**
 * Next.js default browserslist configuration
 * Source: https://nextjs.org/docs/basic-features/supported-browsers-features
 */
export const NEXTJS_DEFAULT_BROWSERSLIST = ["chrome 64", "edge 79", "firefox 67", "opera 51", "safari 12"] as const;

/**
 * Default output directories for different project types
 */
export const DEFAULT_OUTPUT_DIRS: Record<ProjectType, string> = {
  nextjs: ".next/static",
  vite: "dist",
  webpack: "dist",
  rollup: "dist",
  parcel: "dist",
  generic: "dist",
};

/**
 * Project type detection helpers
 */
export const PROJECT_TYPES: Record<ProjectType, ProjectType> = {
  nextjs: "nextjs",
  vite: "vite",
  webpack: "webpack",
  rollup: "rollup",
  parcel: "parcel",
  generic: "generic",
};

export const ProjectTypeKeys = new Set(Object.keys(PROJECT_TYPES) as ProjectType[]);

export const isProjectType = (projectType: string): projectType is ProjectType => {
  return ProjectTypeKeys.has(projectType as ProjectType);
};

/**
 * Get default browserslist for a project type
 */
export function getDefaultBrowserslist(projectType: string): string[] | null {
  switch (projectType) {
    case PROJECT_TYPES.nextjs:
      return [...NEXTJS_DEFAULT_BROWSERSLIST];
    // Add more project types here as needed
    default:
      return null;
  }
}

/**
 * Get default output directory for a project type
 */
export function getDefaultOutputDir(projectType: string): string {
  if (isProjectType(projectType)) {
    return DEFAULT_OUTPUT_DIRS[projectType];
  }

  return DEFAULT_OUTPUT_DIRS.generic;
}

/**
 * Detect project type from package.json dependencies
 */
export function detectProjectType(
  dependencies: Record<string, string> = {},
  devDependencies: Record<string, string> = {},
): ProjectType {
  const allDeps = { ...dependencies, ...devDependencies };

  if (allDeps.next) {
    return PROJECT_TYPES.nextjs;
  }
  if (allDeps.vite) {
    return PROJECT_TYPES.vite;
  }
  if (allDeps.webpack) {
    return PROJECT_TYPES.webpack;
  }
  if (allDeps.rollup) {
    return PROJECT_TYPES.rollup;
  }
  if (allDeps.parcel) {
    return PROJECT_TYPES.parcel;
  }

  return PROJECT_TYPES.generic;
}
