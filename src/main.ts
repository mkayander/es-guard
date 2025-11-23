import * as fs from "fs";
import * as path from "path";

import { checkCompatibility, formatViolationMessage } from "./lib/checkCompatiblity.js";
import { detectProjectConfig, getConfigFileNames } from "./lib/detectTarget.js";
import { getBrowserTargetsFromString } from "./lib/getBrowserTargets.js";
import { setVerboseMode } from "./lib/globalState.js";
import { pluralize } from "./lib/pluralize.js";
import { getCurrentProjectType } from "./lib/projectType.js";
import type { ESGuardOptions, ESGuardResult } from "./lib/types.js";

import { version } from "./version.js";

export async function runESGuard(options: ESGuardOptions = {}): Promise<ESGuardResult> {
  const startTime = process.hrtime.bigint();
  try {
    // Set global verbose mode
    setVerboseMode(options.verbose || false);

    // Use specified working directory or current working directory for configuration detection
    const workingDir = options.workingDir || process.cwd();

    // Auto-detect configuration if not specified
    let scanDirectory: string;
    let outputDirSource: string;
    let target: string | undefined;
    let targetSource: string;
    let browserTargets: string;
    let browserslistSource: string;

    if (options.verbose) {
      console.log("🔍 Auto-detecting project configuration...");
      console.log(`📂 Searching in: ${workingDir}`);

      // Detect and log project type
      const projectType = getCurrentProjectType(workingDir);
      console.log(`🏗️  Project type: ${projectType}`);
      console.log("");
    }

    // Use unified detection to get all configuration at once
    const detectedConfig = detectProjectConfig(workingDir);

    // Handle directory detection
    if (!options.directory) {
      if (detectedConfig.outputDir) {
        // Resolve output directory relative to working directory
        scanDirectory = path.isAbsolute(detectedConfig.outputDir)
          ? detectedConfig.outputDir
          : path.join(workingDir, detectedConfig.outputDir);
        outputDirSource = `auto-detected from ${detectedConfig.outputSource}`;

        if (options.verbose) {
          console.log(`✅ Found output directory: ${scanDirectory} in ${detectedConfig.outputSource}`);
        }
      } else {
        if (options.verbose) {
          console.log("❌ No output directory configuration found, using default 'dist'");
        }
        // Use "dist" as fallback when auto-detection fails
        scanDirectory = path.join(workingDir, "dist");
        outputDirSource = "default fallback";
      }
    } else {
      // Resolve scan directory relative to working directory
      scanDirectory = path.isAbsolute(options.directory) ? options.directory : path.join(workingDir, options.directory);
      outputDirSource = "specified";
    }

    // Validate directory exists
    if (!fs.existsSync(scanDirectory)) {
      throw new Error(`Directory "${scanDirectory}" does not exist (Output directory source: ${outputDirSource})`);
    }

    const stat = fs.statSync(scanDirectory);
    if (!stat.isDirectory()) {
      throw new Error(`"${scanDirectory}" is not a directory`);
    }

    // Handle target detection
    if (options.target) {
      target = options.target;
      targetSource = "specified";
    } else if (detectedConfig.target) {
      target = detectedConfig.target;
      targetSource = `auto-detected from ${detectedConfig.targetSource}`;
    } else {
      if (options.verbose) {
        console.log("❌ No valid configuration files found for target detection");
        console.log("📋 Searched for:");
        const configFileNames = getConfigFileNames();
        configFileNames.forEach((filename, index) => {
          console.log(`   ${index + 1}. ${filename}`);
        });
        console.log("");
      }

      throw new Error(
        "No target specified and could not auto-detect from project configuration files. Please specify a target or ensure your project has a valid configuration file.",
      );
    }

    // Handle browser targets detection
    if (options.browsers) {
      browserTargets = options.browsers;
      browserslistSource = "specified";
      if (options.verbose) {
        console.log(`🌐 Using specified browser targets: ${browserTargets}`);
      }
    } else if (detectedConfig.browserslist) {
      // Use the detected browserslist
      browserTargets = detectedConfig.browserslist.join(", ");
      browserslistSource = `auto-detected from ${detectedConfig.browserslistSource}`;

      if (options.verbose) {
        console.log(`🌐 Using detected browserslist: ${browserTargets} (from ${detectedConfig.browserslistSource})`);
      }
    } else {
      // No browserslist detected, auto-determine from target
      browserTargets = getBrowserTargetsFromString(target);
      browserslistSource = "auto-determined from target";
      if (options.verbose) {
        console.log(`🌐 No browserslist detected, auto-determining from target: ${browserTargets}`);
      }
    }

    if (options.verbose) {
      console.log("");
      console.log("📊 Configuration Summary:");
      console.log(`   Target ES version: ${target}`);
      console.log(`   Target source: ${targetSource}`);
      console.log(`   Browser targets: ${browserTargets}`);
      console.log(`   Browserslist source: ${browserslistSource}`);
      console.log(`   Scan directory: ${scanDirectory}`);
      console.log(`   Output directory source: ${outputDirSource}`);

      console.log("");
    }

    console.log(`🔍 ES-Guard v${version}`);
    console.log(`📁 Scanning directory: ${scanDirectory}`);
    console.log(`🎯 Target ES version: ${target} (${targetSource})`);
    console.log(`🌐 Browser targets: ${browserTargets} (${browserslistSource})`);

    console.log("");

    const { errors, warnings } = await checkCompatibility({
      dir: scanDirectory,
      target: target,
      browsers: browserTargets,
    });

    if (errors.length > 0) {
      console.error(`❌ Found ${errors.length} file(s) with compatibility errors:`);
      for (const violation of errors) {
        console.error(`\n📄 ${violation.file}:`);
        for (let i = 0; i < violation.messages.length; i++) {
          const message = violation.messages[i];
          const sourceMappedMessage = violation.sourceMappedMessages?.[i];
          const formattedMessage = formatViolationMessage(message, sourceMappedMessage, workingDir);
          console.error(`   ${formattedMessage}`);
        }
      }
    }

    if (warnings.length > 0) {
      console.warn(`⚠️  Found ${warnings.length} file(s) with compatibility warnings:`);
      for (const violation of warnings) {
        console.warn(`\n📄 ${violation.file}:`);
        for (let i = 0; i < violation.messages.length; i++) {
          const message = violation.messages[i];
          const sourceMappedMessage = violation.sourceMappedMessages?.[i];
          const formattedMessage = formatViolationMessage(message, sourceMappedMessage, workingDir);
          console.warn(`   ${formattedMessage}`);
        }
      }
    }

    const success = errors.length === 0 || (options.skip ?? false);

    if (errors.length > 0) {
      if (options.skip) {
        console.log("⚠️  Compatibility errors found, but continuing due to --skip option");
      }
    } else {
      console.log("✅ No compatibility errors found!");
      if (warnings.length > 0) {
        console.log(
          "⚠️  There are compat warnings, but no syntax errors. Please address these warnings and update polyfills in your app and in es-guard config.",
        );
      }
    }

    // Calculate statistics
    const totalErrors = errors.reduce((sum, violation) => sum + violation.messages.length, 0);
    const totalWarnings = warnings.reduce((sum, violation) => sum + violation.messages.length, 0);
    const status = success ? "✅ PASSED" : "❌ FAILED";

    // Calculate elapsed time
    const endTime = process.hrtime.bigint();
    const elapsedMs = Number(endTime - startTime) / 1_000_000;
    const elapsedSeconds = (elapsedMs / 1000).toFixed(1);

    console.log(
      `${status} - ${totalErrors} ${pluralize("syntax error", totalErrors)}, ${totalWarnings} ${pluralize("compat warning", totalWarnings)}`,
    );
    console.log(`✅ Done in ${elapsedSeconds}s using es-guard v${version}`);

    return {
      success,
      errors,
      warnings,
      scanDirectory,
      target,
      browserTargets,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error: ${message}`);
    throw error;
  }
}
