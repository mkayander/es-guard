// Main entry point for programmatic usage
export { checkCompatibility, formatViolationMessage } from "./lib/checkCompatiblity.js";
export { detectProjectConfig, detectTarget, detectOutputDir, detectBrowserslist } from "./lib/detectTarget.js";
export { getBrowserTargetsFromString, getBrowserTargets, parseEcmaVersion } from "./lib/getBrowserTargets.js";
export { validateConfig } from "./lib/validateConfig.js";
export { walkDir } from "./lib/walkDir.js";
export { getCurrentProjectType } from "./lib/projectType.js";
export { setVerboseMode, setDebugMode, getGlobalState, setGlobalState } from "./lib/globalState.js";

// Export types for TypeScript users
export type { Config, Violation, SourceMappedMessage, ProjectType } from "./lib/types.js";

// Re-export CompatibilityResult from checkCompatiblity
export type { CompatibilityResult } from "./lib/checkCompatiblity.js";
