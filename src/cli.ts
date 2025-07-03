#!/usr/bin/env node

import * as fs from "fs";
import packageJson from "../package.json" with { type: "json" };
import type { CLIOptions } from "./lib/types.js";
import { checkCompatibility } from "./lib/checkCompatiblity.js";
import { getBrowserTargetsFromString } from "./lib/getBrowserTargets.js";

const version = packageJson.version;

const showHelp = () => {
  console.log(`
ES-Guard v${version} - JavaScript Compatibility Checker

Usage: es-guard [options] [directory]

Options:
  -t, --target <version>    Target ES version (2015, 2016, 2017, etc. or 6, 7, 8, etc. or "latest") [default: 2015]
  -b, --browsers <targets>  Browser targets for compatibility checking [optional: auto-determined from target]
  -h, --help               Show this help message
  -v, --version            Show version number

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
`);
};

const showVersion = () => {
  console.log(`ES-Guard v${version}`);
};

const parseArgs = (): CLIOptions => {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    dir: "dist",
    target: "2015",
    browsers: undefined, // Will be auto-determined if not provided
    help: false,
    version: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "-h":
      case "--help":
        options.help = true;
        break;
      case "-v":
      case "--version":
        options.version = true;
        break;
      case "-t":
      case "--target":
        options.target = args[++i] || "2015";
        break;
      case "-b":
      case "--browsers":
        options.browsers = args[++i];
        break;
      default:
        if (!arg.startsWith("-")) {
          options.dir = arg;
        } else {
          console.error(`Unknown option: ${arg}`);
          console.error("Use --help for usage information");
          process.exit(1);
        }
        break;
    }
  }

  return options;
};

const validateOptions = (options: CLIOptions): void => {
  if (!options.dir) {
    throw new Error("Directory is required");
  }

  if (!fs.existsSync(options.dir)) {
    throw new Error(`Directory "${options.dir}" does not exist`);
  }

  const stat = fs.statSync(options.dir);
  if (!stat.isDirectory()) {
    throw new Error(`"${options.dir}" is not a directory`);
  }

  // Validate ES target format - accept year format (YYYY), numeric format (N), or "latest"
  if (!/^\d{4}$/.test(options.target) && !/^\d+$/.test(options.target) && options.target !== "latest") {
    throw new Error(
      `Invalid ES target: "${options.target}". Expected format: YYYY (e.g., 2015, 2020), numeric (e.g., 6, 11), or "latest"`,
    );
  }

  // browsers is now optional - will be auto-determined if not provided
};

const main = async (): Promise<void> => {
  try {
    const options = parseArgs();

    if (options.help) {
      showHelp();
      return;
    }

    if (options.version) {
      showVersion();
      return;
    }

    validateOptions(options);

    // Determine browser targets
    const browserTargets = options.browsers || getBrowserTargetsFromString(options.target);

    console.log(`🔍 ES-Guard v${version}`);
    console.log(`📁 Scanning directory: ${options.dir}`);
    console.log(`🎯 Target ES version: ${options.target}`);
    console.log(`🌐 Browser targets: ${browserTargets}${options.browsers ? "" : " (auto-determined)"}`);
    console.log("");

    const violations = await checkCompatibility({
      dir: options.dir,
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
};

// Run the CLI
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
