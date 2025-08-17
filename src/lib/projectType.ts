import * as fs from "fs";
import * as path from "path";

import { detectProjectType } from "./defaults.js";
import { getProjectType, isProjectTypeDetected, setProjectType, verboseMode } from "./globalState.js";
import type { ProjectType } from "./types.js";
import { isPackageJson, readJsonFile } from "./utils.js";

/**
 * Detect and cache project type globally (lazy initialization)
 */
export const detectAndCacheProjectType = (cwd: string = process.cwd()): ProjectType | null => {
  // Return cached result if already detected
  if (isProjectTypeDetected()) {
    return getProjectType() || null;
  }

  // Detect project type from package.json
  const packageJsonPath = path.join(cwd, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = readJsonFile(packageJsonPath);
      if (isPackageJson(pkg)) {
        const detectedType = detectProjectType(pkg.dependencies, pkg.devDependencies);
        setProjectType(detectedType);

        if (verboseMode) {
          console.log(`🔍 Project type detected: ${detectedType}`);
        }

        return detectedType;
      }
    } catch (error) {
      // Ignore errors when detecting project type
      if (verboseMode) {
        console.log(`   ⚠️  Error detecting project type: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  // No project type detected
  if (verboseMode) {
    console.log(`🔍 No project type detected`);
  }

  return null;
};

/**
 * Get the current project type (detects if not already cached)
 */
export const getCurrentProjectType = (cwd: string = process.cwd()): ProjectType => {
  return detectAndCacheProjectType(cwd) || "generic";
};
