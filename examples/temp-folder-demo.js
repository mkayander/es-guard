#!/usr/bin/env node

/**
 * ES-Guard Temp Folder Demo
 *
 * This script demonstrates how to use es-guard programmatically
 * from any directory while detecting configuration from a different project root.
 */

import { checkCompatibility, detectProjectConfig, setVerboseMode } from "es-guard";
import path from "path";

async function demonstrateTempFolderUsage() {
  console.log("🚀 ES-Guard Temp Folder Demo\n");

  // Example 1: Run from current directory but use config from a different project
  console.log("=== Example 1: Different Working Directory ===");

  const currentDir = process.cwd();
  console.log(`Current working directory: ${currentDir}`);

  // Simulate running from a temp folder while checking a different project
  const projectRoot = path.resolve(currentDir); // Use current directory as project root for demo
  const tempWorkingDir = path.join(currentDir, "temp-demo");

  console.log(`Project root: ${projectRoot}`);
  console.log(`Temp working directory: ${tempWorkingDir}`);

  try {
    // Detect configuration from the actual project directory
    console.log("\n🔍 Detecting configuration from project root...");
    const config = detectProjectConfig(projectRoot);

    console.log("Detected configuration:");
    console.log(`  Target: ${config.target || "Not found"}`);
    console.log(`  Output directory: ${config.outputDir || "Not found"}`);
    console.log(`  Browserslist: ${config.browserslist ? config.browserslist.join(", ") : "Not found"}`);

    if (config.target && config.outputDir) {
      // Resolve output directory relative to project root
      const outputDir = path.isAbsolute(config.outputDir) ? config.outputDir : path.join(projectRoot, config.outputDir);

      console.log(`\n📁 Checking output directory: ${outputDir}`);

      // Run compatibility check
      const result = await checkCompatibility({
        dir: outputDir,
        target: config.target,
        browsers: config.browserslist ? config.browserslist.join(", ") : undefined,
      });

      console.log(`\n✅ Compatibility check completed:`);
      console.log(`  Errors: ${result.errors.length}`);
      console.log(`  Warnings: ${result.warnings.length}`);
    } else {
      console.log("\n❌ Could not auto-detect configuration from project");
    }
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : String(error));
  }

  // Example 2: CI/CD Pipeline Simulation
  console.log("\n\n=== Example 2: CI/CD Pipeline Simulation ===");

  try {
    // Simulate CI environment variables
    const ciProjectRoot = process.env.CI_PROJECT_ROOT || projectRoot;
    const ciBuildDir = process.env.CI_BUILD_DIR || "dist";

    console.log(`CI environment - Project root: ${ciProjectRoot}`);
    console.log(`CI environment - Build directory: ${ciBuildDir}`);

    // Detect configuration from project root
    console.log("\n🔍 Detecting configuration for CI...");
    const ciConfig = detectProjectConfig(ciProjectRoot);

    if (ciConfig.target) {
      // Use build directory from environment or config
      const scanDir = ciConfig.outputDir || ciBuildDir;
      const fullScanPath = path.isAbsolute(scanDir) ? scanDir : path.join(ciProjectRoot, scanDir);

      console.log(`CI scanning directory: ${fullScanPath}`);

      // In a real CI environment, you would check if the directory exists
      console.log("✅ CI configuration detected successfully");
      console.log(`  Target: ${ciConfig.target}`);
      console.log(`  Scan directory: ${fullScanPath}`);
    } else {
      console.log("❌ CI check failed: Could not detect target");
    }
  } catch (error) {
    console.error("❌ CI simulation error:", error instanceof Error ? error.message : String(error));
  }

  // Example 3: Multi-Project Validation
  console.log("\n\n=== Example 3: Multi-Project Validation ===");

  try {
    // Simulate checking multiple projects from a single location
    const projects = [
      { name: "frontend", path: projectRoot, buildDir: "dist" },
      { name: "backend", path: path.join(projectRoot, "backend"), buildDir: "build" },
      { name: "shared", path: path.join(projectRoot, "shared"), buildDir: "lib" },
    ];

    for (const project of projects) {
      console.log(`\n--- Checking ${project.name} ---`);

      try {
        // Detect configuration for this project
        const projectConfig = detectProjectConfig(project.path);

        if (projectConfig.target) {
          const buildPath = path.join(project.path, project.buildDir);
          console.log(`✅ ${project.name}: Target ${projectConfig.target}, Build: ${buildPath}`);
        } else {
          console.log(`⚠️  ${project.name}: Could not detect target`);
        }
      } catch (error) {
        console.log(`❌ ${project.name}: Check failed - ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  } catch (error) {
    console.error("❌ Multi-project validation error:", error instanceof Error ? error.message : String(error));
  }

  console.log("\n\n🎉 Temp Folder Demo Completed!");
  console.log("\nKey Benefits:");
  console.log("  • Run from any directory (temp folders, CI containers, etc.)");
  console.log("  • Detect configuration from different project roots");
  console.log("  • Support for CI/CD pipelines and build containers");
  console.log("  • Multi-project validation from single location");
  console.log("  • Cross-platform path handling");
}

// Run the demo
demonstrateTempFolderUsage().catch(console.error);
