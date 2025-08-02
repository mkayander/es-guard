#!/usr/bin/env node

import { Command } from "commander";
import * as fs from "fs";
import packageJson from "../package.json" with { type: "json" };
import { checkCompatibility, formatViolationMessage } from "./lib/checkCompatiblity.js";
import { getBrowserTargetsFromString } from "./lib/getBrowserTargets.js";
import { detectProjectConfig, getConfigFileNames } from "./lib/detectTarget.js";
import { getCurrentProjectType } from "./lib/projectType.js";

import { setVerboseMode } from "./lib/globalState.js";

const version = packageJson.version;

// Create the main program
const program = new Command();

// Configure the program
program
  .name("es-guard")
  .description(
    "JavaScript Compatibility Checker - Check if your JavaScript code is compatible with target environments",
  )
  .version(version)
  .argument("[directory]", "Directory to scan for JavaScript files")
  .option(
    "-t, --target <version>",
    "Target ES version (2015, 2016, 2017, etc. or 6, 7, 8, etc. or 'latest'). If not specified, will auto-detect from project config files.",
  )
  .option(
    "-b, --browsers <targets>",
    "Browser targets for compatibility checking (optional: auto-determined from target)",
  )
  .option("-v, --verbose", "Enable verbose output showing detailed detection process and configuration information")
  .addHelpText(
    "after",
    `

Examples:
  es-guard                           # Auto-detect directory and target, scan for compatibility
  es-guard build                     # Check 'build' directory with auto-detected target
  es-guard -t 2020 build             # Check 'build' directory with ES2020 (auto-determined browsers)
  es-guard -t 6 build                # Check 'build' directory with ES6 (auto-determined browsers)
  es-guard -t latest build           # Check 'build' directory with latest ES (auto-determined browsers)
  es-guard --target 2017 --browsers "> 0.5%, last 2 versions" dist
  es-guard --verbose                 # Auto-detect with detailed detection information

Auto-detection searches for ES target in:
  - package.json (browserslist field)
  - tsconfig.json (compilerOptions.target)
  - babel.config.js (.babelrc) (@babel/preset-env targets)
  - vite.config.js/ts (esbuild target)
  - webpack.config.js/ts (target)

Auto-detection behavior:
  - When no directory is specified, auto-detects output directory from config files
  - Falls back to 'dist' directory if no output directory config found
  - Searches for ES target in current working directory
  - Uses the first valid target found (package.json has highest priority)

Browser targets use Browserslist format:
  - If not specified, browsers will be auto-determined from the ES target version
  - "> 1%, last 2 versions, not dead, ie 11" (for ES2015/ES6)
  - "> 1%, last 2 versions, not dead, not ie 11" (for ES2016-2017/ES7-8)
  - "> 1%, last 2 versions, not dead, not ie 11, not op_mini all" (for ES2018-2019/ES9-10)
  - "> 1%, last 2 versions, not dead, not ie 11, not op_mini all, not android < 67" (for ES2020+/ES11+)

Exit codes:
  0 - No compatibility issues found
  1 - Compatibility issues found or error occurred
`,
  );

// Add validation for the target option
program.hook("preAction", (thisCommand) => {
  const options = thisCommand.opts();
  const target = options.target;

  if (target) {
    // Validate ES target format - accept year format (YYYY), numeric format (N), or "latest"
    if (!/^\d{4}$/.test(target) && !/^\d+$/.test(target) && target !== "latest") {
      console.error(
        `Error: Invalid ES target: "${target}". Expected format: YYYY (e.g., 2015, 2020), numeric (e.g., 6, 11), or "latest"`,
      );
      process.exit(1);
    }
  }
});

// Main action
program.action(
  async (directory: string | undefined, options: { target?: string; browsers?: string; verbose?: boolean }) => {
    try {
      // Set global verbose mode
      setVerboseMode(options.verbose || false);

      // Auto-detect configuration if not specified
      let scanDirectory: string;
      let outputDirSource: string;
      let target: string | undefined;
      let targetSource: string;
      let browserTargets: string;
      let browserslistSource: string;

      if (options.verbose) {
        console.log("🔍 Auto-detecting project configuration...");
        console.log(`📂 Searching in: ${process.cwd()}`);

        // Detect and log project type
        const projectType = getCurrentProjectType();
        console.log(`🏗️  Project type: ${projectType}`);
        console.log("");
      }

      // Use unified detection to get all configuration at once
      const detectedConfig = detectProjectConfig(process.cwd());

      // Handle directory detection
      if (!directory) {
        if (detectedConfig.outputDir) {
          scanDirectory = detectedConfig.outputDir;
          outputDirSource = `auto-detected from ${detectedConfig.outputSource}`;

          if (options.verbose) {
            console.log(`✅ Found output directory: ${scanDirectory} in ${detectedConfig.outputSource}`);
          }
        } else {
          if (options.verbose) {
            console.log("❌ No output directory configuration found, using default 'dist'");
          }
          // Use "dist" as fallback when auto-detection fails
          scanDirectory = "dist";
          outputDirSource = "default fallback";
        }
      } else {
        scanDirectory = directory;
        outputDirSource = "specified";
      }

      // Validate directory exists
      if (!fs.existsSync(scanDirectory)) {
        console.error(`Error: Directory "${scanDirectory}" does not exist`);
        console.error(`Output directory source: ${outputDirSource}`);
        process.exit(1);
      }

      const stat = fs.statSync(scanDirectory);
      if (!stat.isDirectory()) {
        console.error(`Error: "${scanDirectory}" is not a directory`);
        process.exit(1);
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

        console.error("Error: No target specified and could not auto-detect from project configuration files.");
        console.error("Please specify a target with --target or ensure your project has a valid configuration file.");
        process.exit(1);
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
            const formattedMessage = formatViolationMessage(message, sourceMappedMessage, process.cwd());
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
            const formattedMessage = formatViolationMessage(message, sourceMappedMessage, process.cwd());
            console.warn(`   ${formattedMessage}`);
          }
        }
      }

      if (errors.length > 0) {
        process.exit(1);
      } else {
        console.log("✅ No compatibility errors found!");
        if (warnings.length > 0) {
          console.log(
            "⚠️  There are compat warnings, but no syntax errors. Please address these warnings and update polyfills in your app and in es-guard config.",
          );
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error: ${message}`);
      process.exit(1);
    }
  },
);

// Parse command line arguments
program.parse();
