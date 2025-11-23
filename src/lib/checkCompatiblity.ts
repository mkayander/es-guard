import { codeFrameColumns } from "@babel/code-frame";
import chalk from "chalk";
import type { Linter } from "eslint";
import { ESLint } from "eslint";
import * as fs from "fs";
import * as path from "path";
import { SourceMapConsumer } from "source-map";

import { createESLintConfig } from "./createESLintConfig.js";
import type { Config, SourceMappedMessage, Violation } from "./types.js";

export type CompatibilityResult = {
  errors: Violation[];
  warnings: Violation[];
};

async function getSourceMapForFile(jsFile: string): Promise<SourceMapConsumer | null> {
  // Try to find a .map file next to the JS file
  const mapFile = jsFile + ".map";
  if (fs.existsSync(mapFile)) {
    const raw = fs.readFileSync(mapFile, "utf-8");
    const map = JSON.parse(raw);
    return await new SourceMapConsumer(map);
  }
  // Try to find a sourceMappingURL comment in the JS file
  const content = fs.readFileSync(jsFile, "utf-8");
  const match = content.match(/\/\/[#@] sourceMappingURL=([^\s]+)/);
  if (match) {
    let mapPath = match[1];
    if (!mapPath.endsWith(".map")) return null;
    // If relative, resolve from jsFile
    if (!path.isAbsolute(mapPath)) {
      mapPath = path.resolve(path.dirname(jsFile), mapPath);
    }
    if (fs.existsSync(mapPath)) {
      const raw = fs.readFileSync(mapPath, "utf-8");
      const map = JSON.parse(raw);
      return await new SourceMapConsumer(map);
    }
  }
  return null;
}

/**
 * Recursively follows source map chains to find the original source file.
 * This handles cases where there are multiple layers of source maps.
 */
async function getOriginalSourceMap(
  jsFile: string,
): Promise<{ consumer: SourceMapConsumer; originalFile?: string } | null> {
  let currentFile = jsFile;
  let consumer: SourceMapConsumer | null = null;
  let originalFile: string | undefined;

  // Follow the source map chain
  while (true) {
    consumer = await getSourceMapForFile(currentFile);
    if (!consumer) break;

    // Get the first source file from this source map
    // Note: SourceMapConsumer doesn't expose sources directly, so we'll use a different approach
    // We'll try to get the original position for the first line to find the source
    const firstPosition = consumer.originalPositionFor({ line: 1, column: 0 });
    if (firstPosition && firstPosition.source) {
      originalFile = firstPosition.source;

      // If this source file is a webpack:// URL, we've reached the end
      if (originalFile.startsWith("webpack://")) {
        break;
      }

      // If this source file exists and is a JS file, continue following the chain
      const resolvedPath = path.isAbsolute(originalFile)
        ? originalFile
        : path.resolve(path.dirname(currentFile), originalFile);

      if (fs.existsSync(resolvedPath) && resolvedPath.endsWith(".js")) {
        // Continue following the chain
        if (consumer.destroy) consumer.destroy();
        currentFile = resolvedPath;
        continue;
      }
    }

    // If we can't find a valid source to follow, stop here
    break;
  }

  return consumer ? { consumer, originalFile } : null;
}

export const checkCompatibility = async (config: Config): Promise<CompatibilityResult> => {
  // Set BROWSERSLIST env variable to override Browserslist file detection
  const originalBrowserslistEnv = process.env.BROWSERSLIST;
  if (config.browsers) {
    process.env.BROWSERSLIST = config.browsers;
  }

  const eslint = new ESLint(createESLintConfig(config.target, config.browsers));
  const errors: Violation[] = [];
  const warnings: Violation[] = [];

  try {
    // Let ESLint handle directory traversal directly
    const results = await eslint.lintFiles([config.dir]);

    if (results.length === 0) {
      console.log(`No JavaScript files found in directory: ${config.dir}`);
      return { errors: [], warnings: [] };
    }

    for (const result of results) {
      // Filter out warnings about noInlineConfig having no effect
      const isRelevantMessage = (m: Linter.LintMessage): boolean => {
        return !m.message.includes("has no effect because you have 'noInlineConfig'");
      };

      const errorMessages = result.messages.filter((m) => m.severity === 2 && isRelevantMessage(m));
      const warningMessages = result.messages.filter((m) => m.severity === 1 && isRelevantMessage(m));

      // Try to remap error/warning locations using sourcemap
      let sourceMappedErrors: SourceMappedMessage[] | undefined = undefined;
      let sourceMappedWarnings: SourceMappedMessage[] | undefined = undefined;
      let sourceMap: SourceMapConsumer | null = null;
      let originalFile: string | undefined = undefined;

      if (errorMessages.length > 0 || warningMessages.length > 0) {
        const sourceMapResult = await getOriginalSourceMap(result.filePath);
        if (sourceMapResult) {
          sourceMap = sourceMapResult.consumer;
          originalFile = sourceMapResult.originalFile;
        }
      }

      if (sourceMap) {
        if (errorMessages.length > 0) {
          sourceMappedErrors = errorMessages.map((msg) => {
            if (msg.line != null && msg.column != null) {
              const orig = sourceMap!.originalPositionFor({
                line: msg.line,
                column: msg.column,
              });
              return {
                ...msg,
                originalFile: orig.source || originalFile || undefined,
                originalLine: orig.line || undefined,
                originalColumn: orig.column || undefined,
              };
            }
            return msg;
          });
        }
        if (warningMessages.length > 0) {
          sourceMappedWarnings = warningMessages.map((msg) => {
            if (msg.line != null && msg.column != null) {
              const orig = sourceMap!.originalPositionFor({
                line: msg.line,
                column: msg.column,
              });
              return {
                ...msg,
                originalFile: orig.source || originalFile || undefined,
                originalLine: orig.line || undefined,
                originalColumn: orig.column || undefined,
              };
            }
            return msg;
          });
        }
        if (sourceMap.destroy) sourceMap.destroy();
      }

      if (errorMessages.length > 0) {
        errors.push({
          file: result.filePath,
          messages: errorMessages,
          sourceMappedMessages: sourceMappedErrors,
        });
      }
      if (warningMessages.length > 0) {
        warnings.push({
          file: result.filePath,
          messages: warningMessages,
          sourceMappedMessages: sourceMappedWarnings,
        });
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not lint directory ${config.dir}:`, error);
  } finally {
    // Restore original BROWSERSLIST env variable
    if (originalBrowserslistEnv !== undefined) {
      process.env.BROWSERSLIST = originalBrowserslistEnv;
    } else {
      delete process.env.BROWSERSLIST;
    }
  }

  return { errors, warnings };
};

/**
 * Formats a violation message with source map information and creates a link to the actual source file.
 * @param message The lint message
 * @param sourceMappedMessage Optional source mapped message with original file information
 * @param baseDir Base directory for resolving relative paths
 * @param explicitFilePath Explicit file path for code frame
 * @returns Formatted message string
 */
export const formatViolationMessage = (
  message: Linter.LintMessage,
  sourceMappedMessage?: SourceMappedMessage,
  baseDir: string = process.cwd(),
  explicitFilePath?: string,
): string => {
  const lineCol = chalk.gray(`${message.line}:${message.column}`);
  const ruleInfo = message.ruleId ? chalk.dim(` (${message.ruleId})`) : "";

  let codeFrame = "";
  let filePath: string | undefined;
  let line: number | undefined;
  let column: number | undefined;
  let canReadSource = false;

  // Prefer explicit file path if provided
  if (explicitFilePath) {
    filePath = explicitFilePath;
    line = message.line;
    column = message.column;
    canReadSource = fs.existsSync(filePath);
  } else if (sourceMappedMessage?.originalFile && sourceMappedMessage?.originalLine) {
    const originalFile = sourceMappedMessage.originalFile;
    line = sourceMappedMessage.originalLine;
    column = sourceMappedMessage.originalColumn || 0;

    // Handle webpack:// URLs - try to extract the actual file path
    if (originalFile.startsWith("webpack://")) {
      const match = originalFile.match(/webpack:\/\/[^/]*\/(.+)$/);
      if (match) {
        const extractedPath = match[1];
        const possiblePaths = [
          path.join(baseDir, extractedPath),
          path.join(baseDir, "src", extractedPath),
          path.join(baseDir, "app", extractedPath),
          path.join(baseDir, "pages", extractedPath),
          path.join(baseDir, "components", extractedPath),
        ];
        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            filePath = possiblePath;
            canReadSource = true;
            break;
          }
        }
      }
      if (!filePath) {
        filePath = undefined;
        canReadSource = false;
      }
    } else {
      filePath = originalFile;
      if (!path.isAbsolute(filePath)) {
        const cleanPath = filePath.replace(/^\.\//, "");
        filePath = path.join(baseDir, cleanPath);
      }
      canReadSource = fs.existsSync(filePath);
    }
  } else if (message.line && message.column) {
    filePath = undefined;
    line = message.line;
    column = message.column;
  }

  // Try to print a code frame if we have a readable file path
  if (filePath && canReadSource && line) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const lines = raw.split(/\r?\n/);
      const isMinified =
        lines.length === 1 || (line <= lines.length && lines[line - 1] && lines[line - 1].length > 300);
      if (!isMinified) {
        codeFrame =
          "\n" +
          codeFrameColumns(
            raw,
            { start: { line, column: column || 1 } },
            { highlightCode: true, linesAbove: 1, linesBelow: 1 },
          );
      }
    } catch {
      // ignore
    }
  }

  // If we have source-mapped info, show the original source
  if (sourceMappedMessage?.originalFile && sourceMappedMessage?.originalLine) {
    const originalFile = sourceMappedMessage.originalFile;
    const originalLine = sourceMappedMessage.originalLine;
    const originalCol = sourceMappedMessage.originalColumn || 0;

    let linkIndicator: string;
    let linkPath: string | undefined;
    if (originalFile.startsWith("webpack://")) {
      linkIndicator = canReadSource ? "[src]" : "[map]";
      if (canReadSource && filePath) linkPath = filePath;
    } else if (canReadSource && filePath) {
      linkIndicator = "[src]";
      linkPath = filePath;
    } else {
      linkIndicator = "[file]";
    }

    // Only make the path clickable if it points to a real file
    let originalDisplay: string;
    if (linkPath && fs.existsSync(linkPath)) {
      const fileUri = `file://${linkPath.replace(/\\/g, "/")}`;
      originalDisplay = `${chalk.magenta(linkIndicator)} ${chalk.bold("Original:")} ${chalk.cyan(fileUri)}:${chalk.yellow(originalLine)}:${chalk.yellow(originalCol)}`;
    } else {
      originalDisplay = `${chalk.magenta(linkIndicator)} ${chalk.bold("Original:")} ${chalk.cyan(originalFile)}:${chalk.yellow(originalLine)}:${chalk.yellow(originalCol)}`;
    }

    const isError = message.severity === 2;
    const label = isError ? chalk.red.bold("ERROR") : chalk.yellow.bold("WARNING");

    return `${lineCol} ${label}: ${chalk.bold(message.message)}${ruleInfo}\n    ${originalDisplay}\n    ${codeFrame}`;
  }

  // No source map info
  const isError = message.severity === 2;
  const label = isError ? chalk.red.bold("ERROR") : chalk.yellow.bold("WARNING");
  return `${lineCol} ${label}: ${chalk.bold(message.message)}${ruleInfo}\n    ${codeFrame}`;
};
