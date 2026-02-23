#!/usr/bin/env node
import { Command } from "commander";

import { runESGuard } from "./main.js";
import { version } from "./version.js";

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
  .option("--skip", "Do not exit with error code when compatibility errors are found")
  .option("--no-compat", "Disable compat/compat rule - only report syntax errors, not browser compatibility warnings")
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
  es-guard --skip                    # Auto-detect and continue even if compatibility errors are found
  es-guard --no-compat               # Only check syntax, skip browser compatibility warnings


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
  1 - Compatibility issues found or error occurred (unless --skip is used)
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

interface CliOptions {
  target?: string;
  browsers?: string;
  verbose?: boolean;
  skip?: boolean;
  compat?: boolean; // Commander uses --no-compat, so the option becomes compat: false
}

// Main CLI action
program.action(async (directory: string | undefined, options: CliOptions) => {
  try {
    const result = await runESGuard({
      ...options,
      directory,
      skipCompatWarnings: options.compat === false,
    });

    if (!result.success && !options.skip) {
      process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error: ${message}`);
    process.exit(1);
  }
});

// Parse command line arguments
program.parse();
