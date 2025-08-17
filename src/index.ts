// Main entry point for programmatic usage
export { checkCompatibility, formatViolationMessage } from "./lib/checkCompatiblity.js";
export { detectProjectConfig, detectTarget, detectOutputDir, detectBrowserslist } from "./lib/detectTarget.js";
export { getBrowserTargetsFromString, getBrowserTargets, parseEcmaVersion } from "./lib/getBrowserTargets.js";
export { validateConfig } from "./lib/validateConfig.js";
export { getCurrentProjectType } from "./lib/projectType.js";
export { runESGuard } from "./main.js";
export {
  setVerboseMode,
  setDebugMode,
  getGlobalState,
  setGlobalState,
  resetGlobalState,
  setProjectType,
  getProjectType,
  isProjectTypeDetected,
} from "./lib/globalState.js";

// Export types for TypeScript users
export type {
  Config,
  Violation,
  SourceMappedMessage,
  ProjectType,
  ESGuardOptions,
  ESGuardResult,
} from "./lib/types.js";

// Re-export CompatibilityResult from checkCompatiblity
export type { CompatibilityResult } from "./lib/checkCompatiblity.js";

export type { DetectionResult } from "./lib/detectTarget.js";
