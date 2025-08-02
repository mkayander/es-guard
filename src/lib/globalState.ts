// Global state management for CLI options and project configuration

interface GlobalState {
  verbose: boolean;
  debug: boolean;
  projectType?: string;
  projectTypeDetected: boolean;
}

// Static global state variables
export let verboseMode = false;
export let debugMode = false;
export let projectType: string | undefined = undefined;
export let projectTypeDetected = false;

/**
 * Set the global verbose mode
 */
export const setVerboseMode = (enabled: boolean) => {
  verboseMode = enabled;
};

/**
 * Set the global debug mode
 */
export const setDebugMode = (enabled: boolean) => {
  debugMode = enabled;
};

/**
 * Get the entire global state
 */
export const getGlobalState = (): GlobalState => {
  return {
    verbose: verboseMode,
    debug: debugMode,
    projectType,
    projectTypeDetected,
  };
};

/**
 * Set multiple global state options at once
 */
export const setGlobalState = (options: Partial<GlobalState>) => {
  if (options.verbose !== undefined) verboseMode = options.verbose;
  if (options.debug !== undefined) debugMode = options.debug;
  if (options.projectType !== undefined) projectType = options.projectType;
  if (options.projectTypeDetected !== undefined) projectTypeDetected = options.projectTypeDetected;
};

/**
 * Reset global state to defaults
 */
export const resetGlobalState = () => {
  verboseMode = false;
  debugMode = false;
  projectType = undefined;
  projectTypeDetected = false;
};

/**
 * Set the detected project type globally
 */
export const setProjectType = (detectedType: string) => {
  projectType = detectedType;
  projectTypeDetected = true;
};

/**
 * Get the detected project type (lazy detection if not already done)
 */
export const getProjectType = (): string | undefined => {
  return projectType;
};

/**
 * Check if project type has been detected
 */
export const isProjectTypeDetected = (): boolean => {
  return projectTypeDetected;
};
