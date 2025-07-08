import { ESLint, Linter } from "eslint";
import { createESLintConfig } from "./createESLintConfig.js";
import { Config, Violation, SourceMappedMessage } from "./types.js";
import { walkDir } from "./walkDir.js";
import * as fs from "fs";
import * as path from "path";
import { SourceMapConsumer } from "source-map";

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

export const checkCompatibility = async (config: Config): Promise<CompatibilityResult> => {
  const jsFiles = walkDir(config.dir);

  if (jsFiles.length === 0) {
    console.log(`No JavaScript files found in directory: ${config.dir}`);
    return { errors: [], warnings: [] };
  }

  // Set BROWSERSLIST env variable to override Browserslist file detection
  const originalBrowserslistEnv = process.env.BROWSERSLIST;
  if (config.browsers) {
    process.env.BROWSERSLIST = config.browsers;
  }

  const eslint = new ESLint(createESLintConfig(config.target, config.browsers));
  const errors: Violation[] = [];
  const warnings: Violation[] = [];

  for (const file of jsFiles) {
    try {
      const results = await eslint.lintFiles([file]);
      if (Array.isArray(results)) {
        for (const result of results) {
          const errorMessages = result.messages.filter((m) => m.severity === 2);
          const warningMessages = result.messages.filter((m) => m.severity === 1);

          // Try to remap error/warning locations using sourcemap
          let sourceMappedErrors: SourceMappedMessage[] | undefined = undefined;
          let sourceMappedWarnings: SourceMappedMessage[] | undefined = undefined;
          let sourceMap: SourceMapConsumer | null = null;
          if (errorMessages.length > 0 || warningMessages.length > 0) {
            sourceMap = await getSourceMapForFile(file);
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
                    originalFile: orig.source || undefined,
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
                    originalFile: orig.source || undefined,
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
      } else {
        console.warn(`Warning: ESLint did not return an array for file ${file}.`, results);
      }
    } catch (error) {
      console.warn(`Warning: Could not lint file ${file}:`, error);
    }
  }

  // Restore original BROWSERSLIST env variable
  if (originalBrowserslistEnv !== undefined) {
    process.env.BROWSERSLIST = originalBrowserslistEnv;
  } else {
    delete process.env.BROWSERSLIST;
  }

  return { errors, warnings };
};

/**
 * Formats a violation message with source map information and creates a link to the actual source file.
 * @param message The lint message
 * @param sourceMappedMessage Optional source mapped message with original file information
 * @param baseDir Base directory for resolving relative paths
 * @returns Formatted message string
 */
export const formatViolationMessage = (
  message: Linter.LintMessage,
  sourceMappedMessage?: SourceMappedMessage,
  baseDir: string = process.cwd(),
): string => {
  const lineCol = `${message.line}:${message.column}`;
  const ruleInfo = message.ruleId ? ` (${message.ruleId})` : "";

  // If we have source mapped information, show the original source
  if (sourceMappedMessage?.originalFile && sourceMappedMessage?.originalLine) {
    const originalFile = sourceMappedMessage.originalFile;
    const originalLine = sourceMappedMessage.originalLine;
    const originalCol = sourceMappedMessage.originalColumn || 0;

    // Try to resolve the original file path relative to base directory
    let resolvedOriginalFile = originalFile;
    if (!path.isAbsolute(originalFile)) {
      // Remove any webpack:// or similar prefixes
      const cleanPath = originalFile.replace(/^webpack:\/\/\//, "").replace(/^\.\//, "");
      resolvedOriginalFile = path.join(baseDir, cleanPath);
    }

    // Create a clickable link if the file exists
    const fileExists = fs.existsSync(resolvedOriginalFile);
    const linkIndicator = fileExists ? "🔗" : "📄";

    return `${lineCol} - ${message.message}${ruleInfo}\n     ${linkIndicator} Original: ${originalFile}:${originalLine}:${originalCol}`;
  }

  return `${lineCol} - ${message.message}${ruleInfo}`;
};
