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
import path from "path";

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

// Example 9: CI/CD pipeline usage with different working directories
async function cicdUsage(): Promise<void> {
  console.log("\n=== CI/CD Pipeline Usage Example ===");

  try {
    // Example: Running in CI where working directory might be different
    const projectRoot = process.env.PROJECT_ROOT || process.cwd();
    const buildDir = process.env.BUILD_DIR || "dist";

    console.log(`CI environment - Project root: ${projectRoot}`);
    console.log(`CI environment - Build directory: ${buildDir}`);

    // Detect configuration from project root
    const config = detectProjectConfig(projectRoot);
    console.log("CI detected config:", config);

    if (config.target) {
      // Use build directory from environment or config
      const scanDir = config.outputDir || buildDir;
      const fullScanPath = path.isAbsolute(scanDir) ? scanDir : path.join(projectRoot, scanDir);

      console.log(`CI scanning directory: ${fullScanPath}`);

      const result = await checkCompatibility({
        dir: fullScanPath,
        target: config.target,
        browsers: config.browserslist ? config.browserslist.join(", ") : undefined,
      });

      console.log(`CI check completed: ${result.errors.length} errors, ${result.warnings.length} warnings`);

      // In CI, you might want to exit with error code
      if (result.errors.length > 0) {
        console.error("CI check failed with compatibility errors");
        process.exit(1);
      }
    } else {
      console.error("CI check failed: Could not detect target");
      process.exit(1);
    }
  } catch (error) {
    console.error("CI/CD usage failed:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Example 10: Multi-project validation from a single script
async function multiProjectValidation(): Promise<void> {
  console.log("\n=== Multi-Project Validation Example ===");

  const projects = [
    { name: "frontend", path: "/path/to/frontend", buildDir: "dist" },
    { name: "backend", path: "/path/to/backend", buildDir: "build" },
    { name: "shared", path: "/path/to/shared", buildDir: "lib" },
  ];

  for (const project of projects) {
    try {
      console.log(`\n--- Checking ${project.name} ---`);

      // Detect configuration for this project
      const config = detectProjectConfig(project.path);
      console.log(`${project.name} config:`, config);

      if (config.target) {
        const buildPath = path.join(project.path, project.buildDir);

        const result = await checkCompatibility({
          dir: buildPath,
          target: config.target,
          browsers: config.browserslist ? config.browserslist.join(", ") : undefined,
        });

        console.log(`${project.name}: ${result.errors.length} errors, ${result.warnings.length} warnings`);
      } else {
        console.log(`${project.name}: Could not detect target`);
      }
    } catch (error) {
      console.error(`${project.name} check failed:`, error instanceof Error ? error.message : String(error));
    }
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

  await cicdUsage();
  await multiProjectValidation();

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
  cicdUsage,
  multiProjectValidation,
  runExamples,
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}
