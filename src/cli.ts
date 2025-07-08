#!/usr/bin/env node

import { Command } from "commander";
import * as fs from "fs";
import packageJson from "../package.json" with { type: "json" };
import { checkCompatibility } from "./lib/checkCompatiblity.js";
import { getBrowserTargetsFromString } from "./lib/getBrowserTargets.js";
import { detectTarget, detectOutputDir } from "./lib/detectTarget.js";
import { setVerboseMode } from "./lib/globalState.js";
import path from "path";

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

      // Auto-detect output directory if not specified
      let scanDirectory: string;
      let outputDirSource: string;

      if (!directory) {
        if (options.verbose) {
          console.log("🔍 No directory specified, auto-detecting output directory from project configuration files...");
          console.log(`📂 Searching in: ${process.cwd()}`);
          console.log("");
        }

        // Try to detect output directory from current working directory
        const detectedOutput = detectOutputDir(process.cwd());

        if (detectedOutput) {
          scanDirectory = detectedOutput.outputDir;
          outputDirSource = `auto-detected from ${detectedOutput.source}`;

          if (options.verbose) {
            console.log(`✅ Found output directory: ${scanDirectory} in ${detectedOutput.source}`);
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

      // Determine target - use provided target or auto-detect
      let target = options.target;
      let targetSource = "specified";

      if (!target) {
        if (options.verbose) {
          console.log("🔍 Auto-detecting ES target from project configuration files...");
          console.log(`📂 Searching in: ${process.cwd()}`);
          console.log("");
        }

        // Try to detect target from current working directory
        const detectedResult = detectTarget(process.cwd());

        if (detectedResult) {
          target = detectedResult.target;
          targetSource = `auto-detected from ${detectedResult.source}`;
        } else {
          if (options.verbose) {
            console.log("❌ No valid configuration files found for target detection");
            console.log("📋 Searched for:");
            console.log("   - package.json (browserslist field)");
            console.log("   - .browserslistrc/.browserslist");
            console.log("   - tsconfig.json (compilerOptions.target)");
            console.log("   - babel.config.js/.babelrc (@babel/preset-env targets)");
            console.log("   - vite.config.js/ts (esbuild target)");
            console.log("   - webpack.config.js/ts (target)");
            console.log("   - next.config.js/ts (output directory)");
            console.log("");
          }

          console.error("Error: No target specified and could not auto-detect from project configuration files.");
          console.error("Please specify a target with --target or ensure your project has a valid configuration file.");
          process.exit(1);
        }
      }

      // Determine browser targets
      let browserTargets: string;
      if (options.browsers) {
        browserTargets = options.browsers;
        if (options.verbose) {
          console.log(`🌐 Using specified browser targets: ${browserTargets}`);
        }
      } else {
        // If auto-detected from package.json or browserslist file, check for ES version strings
        if (targetSource.startsWith("auto-detected from ")) {
          const configFile = targetSource.replace("auto-detected from ", "");
          let browserslistEntries: string[] = [];
          if (configFile === "package.json") {
            const pkgPath = path.join(process.cwd(), "package.json");
            if (fs.existsSync(pkgPath)) {
              const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
              if (pkg.browserslist) {
                browserslistEntries = Array.isArray(pkg.browserslist) ? pkg.browserslist : [pkg.browserslist];
              }
            }
          } else if (configFile === ".browserslistrc" || configFile === ".browserslist") {
            const blPath = path.join(process.cwd(), configFile);
            if (fs.existsSync(blPath)) {
              browserslistEntries = fs
                .readFileSync(blPath, "utf-8")
                .split(/\r?\n/)
                .map((l: string) => l.trim())
                .filter((l: string) => l && !l.startsWith("#"));
            }
          }
          const esVersionRegex = /^es\d{1,4}$/i;
          const invalidEntries = browserslistEntries.filter((entry) => esVersionRegex.test(entry));
          if (invalidEntries.length > 0) {
            console.warn(
              `Warning: Detected ES version string(s) in browserslist (${invalidEntries.join(", ")}). These are not valid Browserslist queries and will be ignored for browser compatibility checks.`,
            );
          }
        }
        browserTargets = getBrowserTargetsFromString(target);
        if (options.verbose) {
          console.log(`🌐 Auto-determined browser targets: ${browserTargets}`);
        }
      }

      if (options.verbose) {
        console.log("");
        console.log("📊 Configuration Summary:");
        console.log(`   Target ES version: ${target}`);
        console.log(`   Target source: ${targetSource}`);
        console.log(`   Browser targets: ${browserTargets}`);
        console.log(`   Scan directory: ${scanDirectory}`);
        console.log(`   Output directory source: ${outputDirSource}`);
        console.log("");
      }

      console.log(`🔍 ES-Guard v${version}`);
      console.log(`📁 Scanning directory: ${scanDirectory}`);
      console.log(`🎯 Target ES version: ${target} (${targetSource})`);
      console.log(`🌐 Browser targets: ${browserTargets}${options.browsers ? "" : " (auto-determined)"}`);
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
          for (const message of violation.messages) {
            console.error(`   ${message.line}:${message.column} - ${message.message} (${message.ruleId})`);
          }
        }
      }

      if (warnings.length > 0) {
        console.warn(`⚠️  Found ${warnings.length} file(s) with compatibility warnings:`);
        for (const violation of warnings) {
          console.warn(`\n📄 ${violation.file}:`);
          for (const message of violation.messages) {
            console.warn(`   ${message.line}:${message.column} - ${message.message} (${message.ruleId})`);
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
