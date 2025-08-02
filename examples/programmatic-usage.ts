// TypeScript example: Programmatic usage of es-guard
import {
  checkCompatibility,
  detectProjectConfig,
  getBrowserTargetsFromString,
  validateConfig,
  getCurrentProjectType,
  setVerboseMode,
  type Config,
  type CompatibilityResult,
  type Violation,
} from "es-guard";

// Example 1: Basic compatibility checking with proper types
async function basicCompatibilityCheck(): Promise<void> {
  console.log("=== Basic Compatibility Check ===");

  const config: Config = {
    dir: "dist",
    target: "2020",
    browsers: "> 1%, last 2 versions, not dead",
  };

  try {
    const result: CompatibilityResult = await checkCompatibility(config);

    console.log(`Found ${result.errors.length} errors and ${result.warnings.length} warnings`);

    if (result.errors.length > 0) {
      console.log("Errors:", result.errors);
    }

    if (result.warnings.length > 0) {
      console.log("Warnings:", result.warnings);
    }
  } catch (error) {
    console.error("Compatibility check failed:", error instanceof Error ? error.message : String(error));
  }
}

// Example 2: Auto-detection with project configuration
async function autoDetectAndCheck(): Promise<void> {
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
    console.error("Auto-detection failed:", error instanceof Error ? error.message : String(error));
  }
}

// Example 3: Configuration validation with type safety
function validateConfiguration(): void {
  console.log("\n=== Configuration Validation ===");

  const config: Config = {
    dir: "dist",
    target: "2020",
  };

  try {
    validateConfig(config);
    console.log("Configuration is valid");
  } catch (error) {
    console.error("Configuration validation failed:", error instanceof Error ? error.message : String(error));
  }
}

// Example 4: Utility functions with proper typing
function utilityExamples(): void {
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

// Example 5: Verbose mode with proper error handling
async function verboseExample(): Promise<void> {
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
    console.error("Verbose check failed:", error instanceof Error ? error.message : String(error));
  }

  // Disable verbose mode
  setVerboseMode(false);
}

// Example 6: Error handling and custom configuration with types
async function customConfiguration(): Promise<void> {
  console.log("\n=== Custom Configuration ===");

  try {
    // Custom browser targets for specific requirements
    const result = await checkCompatibility({
      dir: "dist",
      target: "2015",
      browsers: "> 0.5%, last 2 versions, Firefox ESR, not dead, ie 11",
    });

    console.log(`Custom config check: ${result.errors.length} errors, ${result.warnings.length} warnings`);

    // Process results with proper typing
    result.errors.forEach((violation: Violation) => {
      console.log(`Error in ${violation.file}:`);
      violation.messages.forEach((message) => {
        console.log(`  Line ${message.line}: ${message.message}`);
      });
    });
  } catch (error) {
    console.error("Custom configuration failed:", error instanceof Error ? error.message : String(error));
  }
}

// Example 7: Advanced usage with result processing
async function advancedUsage(): Promise<void> {
  console.log("\n=== Advanced Usage ===");

  try {
    const result = await checkCompatibility({
      dir: "dist",
      target: "2020",
    });

    // Process errors by severity
    const criticalErrors = result.errors.filter((violation) => violation.messages.some((msg) => msg.severity === 2));

    const warnings = result.warnings.filter((violation) => violation.messages.some((msg) => msg.severity === 1));

    console.log(`Critical errors: ${criticalErrors.length}`);
    console.log(`Warnings: ${warnings.length}`);

    // Process source-mapped messages if available
    result.errors.forEach((violation) => {
      if (violation.sourceMappedMessages) {
        violation.sourceMappedMessages.forEach((msg) => {
          if (msg.originalFile && msg.originalLine) {
            console.log(`Original source: ${msg.originalFile}:${msg.originalLine}`);
          }
        });
      }
    });
  } catch (error) {
    console.error("Advanced usage failed:", error instanceof Error ? error.message : String(error));
  }
}

// Run all examples
async function runExamples(): Promise<void> {
  console.log("ES-Guard TypeScript Programmatic Usage Examples\n");

  await basicCompatibilityCheck();
  await autoDetectAndCheck();
  validateConfiguration();
  utilityExamples();
  await verboseExample();
  await customConfiguration();
  await advancedUsage();

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
  advancedUsage,
  runExamples,
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}
