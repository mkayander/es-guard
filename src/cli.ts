#!/usr/bin/env node

import { Command } from "commander";
import * as fs from "fs";
import packageJson from "../package.json" with { type: "json" };
import { checkCompatibility } from "./lib/checkCompatiblity.js";
import { getBrowserTargetsFromString } from "./lib/getBrowserTargets.js";

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
  .argument("[directory]", "Directory to scan for JavaScript files", "dist")
  .option("-t, --target <version>", "Target ES version (2015, 2016, 2017, etc. or 6, 7, 8, etc. or 'latest')", "2015")
  .option(
    "-b, --browsers <targets>",
    "Browser targets for compatibility checking (optional: auto-determined from target)",
  )
  .addHelpText(
    "after",
    `

Examples:
  es-guard                           # Check 'dist' directory with ES2015 (auto-determined browsers)
  es-guard build                     # Check 'build' directory with ES2015 (auto-determined browsers)
  es-guard -t 2020 build             # Check 'build' directory with ES2020 (auto-determined browsers)
  es-guard -t 6 build                # Check 'build' directory with ES6 (auto-determined browsers)
  es-guard -t latest build           # Check 'build' directory with latest ES (auto-determined browsers)
  es-guard --target 2017 --browsers "> 0.5%, last 2 versions" dist

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

  // Validate ES target format - accept year format (YYYY), numeric format (N), or "latest"
  if (!/^\d{4}$/.test(target) && !/^\d+$/.test(target) && target !== "latest") {
    console.error(
      `Error: Invalid ES target: "${target}". Expected format: YYYY (e.g., 2015, 2020), numeric (e.g., 6, 11), or "latest"`,
    );
    process.exit(1);
  }
});

// Main action
program.action(async (directory: string, options: { target: string; browsers?: string }) => {
  try {
    // Validate directory exists
    if (!fs.existsSync(directory)) {
      console.error(`Error: Directory "${directory}" does not exist`);
      process.exit(1);
    }

    const stat = fs.statSync(directory);
    if (!stat.isDirectory()) {
      console.error(`Error: "${directory}" is not a directory`);
      process.exit(1);
    }

    // Determine browser targets
    const browserTargets = options.browsers || getBrowserTargetsFromString(options.target);

    console.log(`🔍 ES-Guard v${version}`);
    console.log(`📁 Scanning directory: ${directory}`);
    console.log(`🎯 Target ES version: ${options.target}`);
    console.log(`🌐 Browser targets: ${browserTargets}${options.browsers ? "" : " (auto-determined)"}`);
    console.log("");

    const violations = await checkCompatibility({
      dir: directory,
      target: options.target,
      browsers: browserTargets,
    });

    if (violations.length > 0) {
      console.error(`❌ Found ${violations.length} file(s) with compatibility issues:`);

      for (const violation of violations) {
        console.error(`\n📄 ${violation.file}:`);
        for (const message of violation.messages) {
          console.error(`   ${message.line}:${message.column} - ${message.message} (${message.ruleId})`);
        }
      }

      process.exit(1);
    } else {
      console.log("✅ No compatibility issues found!");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error: ${message}`);
    process.exit(1);
  }
});

// Parse command line arguments
program.parse();
