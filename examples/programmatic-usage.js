// Example: Programmatic usage of es-guard
import {
  checkCompatibility,
  detectProjectConfig,
  getBrowserTargetsFromString,
  validateConfig,
  getCurrentProjectType,
  setVerboseMode,
} from "es-guard";

// Example 1: Basic compatibility checking
async function basicCompatibilityCheck() {
  console.log("=== Basic Compatibility Check ===");

  try {
    const result = await checkCompatibility({
      dir: "dist",
      target: "2020",
      browsers: "> 1%, last 2 versions, not dead",
    });

    console.log(`Found ${result.errors.length} errors and ${result.warnings.length} warnings`);

    if (result.errors.length > 0) {
      console.log("Errors:", result.errors);
    }

    if (result.warnings.length > 0) {
      console.log("Warnings:", result.warnings);
    }
  } catch (error) {
    console.error("Compatibility check failed:", error.message);
  }
}

// Example 2: Auto-detection with project configuration
async function autoDetectAndCheck() {
  console.log("\n=== Auto-detection Example ===");

  try {
    // Detect project configuration
    const config = detectProjectConfig(process.cwd());
    console.log("Detected config:", config);

    if (config.target && config.outputDir) {
      const result = await checkCompatibility({
        dir: config.outputDir,
        target: config.target,
        browsers: config.browserslist ? config.browserslist.join(", ") : undefined,
      });

      console.log(`Auto-detected check: ${result.errors.length} errors, ${result.warnings.length} warnings`);
    } else {
      console.log("Could not auto-detect configuration");
    }
  } catch (error) {
    console.error("Auto-detection failed:", error.message);
  }
}

// Example 3: Configuration validation
function validateConfiguration() {
  console.log("\n=== Configuration Validation ===");

  try {
    validateConfig({
      dir: "dist",
      target: "2020",
    });
    console.log("Configuration is valid");
  } catch (error) {
    console.error("Configuration validation failed:", error.message);
  }
}

// Example 4: Utility functions
function utilityExamples() {
  console.log("\n=== Utility Functions ===");

  // Get browser targets for different ES versions
  console.log("ES2015 browsers:", getBrowserTargetsFromString("2015"));
  console.log("ES2020 browsers:", getBrowserTargetsFromString("2020"));
  console.log("Latest browsers:", getBrowserTargetsFromString("latest"));

  // Detect project type
  const projectType = getCurrentProjectType();
  console.log("Project type:", projectType);

  // Note: Directory walking is handled automatically by checkCompatibility
  console.log("Directory traversal is handled automatically by checkCompatibility");
}

// Example 5: Verbose mode
async function verboseExample() {
  console.log("\n=== Verbose Mode Example ===");

  // Enable verbose mode for detailed output
  setVerboseMode(true);

  try {
    const result = await checkCompatibility({
      dir: "dist",
      target: "2020",
    });

    console.log("Verbose check completed");
  } catch (error) {
    console.error("Verbose check failed:", error.message);
  }

  // Disable verbose mode
  setVerboseMode(false);
}

// Example 6: Error handling and custom configuration
async function customConfiguration() {
  console.log("\n=== Custom Configuration ===");

  try {
    // Custom browser targets for specific requirements
    const result = await checkCompatibility({
      dir: "dist",
      target: "2015",
      browsers: "> 0.5%, last 2 versions, Firefox ESR, not dead, ie 11",
    });

    console.log(`Custom config check: ${result.errors.length} errors, ${result.warnings.length} warnings`);

    // Process results
    result.errors.forEach((violation) => {
      console.log(`Error in ${violation.file}:`);
      violation.messages.forEach((message) => {
        console.log(`  Line ${message.line}: ${message.message}`);
      });
    });
  } catch (error) {
    console.error("Custom configuration failed:", error.message);
  }
}

// Run all examples
async function runExamples() {
  console.log("ES-Guard Programmatic Usage Examples\n");

  await basicCompatibilityCheck();
  await autoDetectAndCheck();
  validateConfiguration();
  utilityExamples();
  await verboseExample();
  await customConfiguration();

  console.log("\n=== Examples completed ===");
}

// Export for use in other modules
export {
  basicCompatibilityCheck,
  autoDetectAndCheck,
  validateConfiguration,
  utilityExamples,
  verboseExample,
  customConfiguration,
  runExamples,
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}
