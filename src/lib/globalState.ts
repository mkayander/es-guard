// Global state management for CLI options

interface GlobalState {
  verbose: boolean;
  debug: boolean;
}

// Static global state variables
export let verboseMode = false;
export let debugMode = false;

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
  };
};

/**
 * Set multiple global state options at once
 */
export const setGlobalState = (options: Partial<GlobalState>) => {
  if (options.verbose !== undefined) verboseMode = options.verbose;
  if (options.debug !== undefined) debugMode = options.debug;
};

/**
 * Reset global state to defaults
 */
export const resetGlobalState = () => {
  verboseMode = false;
  debugMode = false;
};
