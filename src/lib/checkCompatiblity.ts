import { ESLint } from "eslint";
import { createESLintConfig } from "./createESLintConfig.js";
import { Config, Violation } from "./types.js";
import { walkDir } from "./walkDir.js";

export const checkCompatibility = async (config: Config): Promise<Violation[]> => {
  const jsFiles = walkDir(config.dir);

  if (jsFiles.length === 0) {
    console.log(`No JavaScript files found in directory: ${config.dir}`);
    return [];
  }

  // Set BROWSERSLIST env variable to override Browserslist file detection
  const originalBrowserslistEnv = process.env.BROWSERSLIST;
  if (config.browsers) {
    process.env.BROWSERSLIST = config.browsers;
  }

  const eslint = new ESLint(createESLintConfig(config.target, config.browsers));
  const violations: Violation[] = [];

  for (const file of jsFiles) {
    try {
      const results = await eslint.lintFiles([file]);
      if (Array.isArray(results)) {
        for (const result of results) {
          if (result.messages.length > 0) {
            violations.push({
              file: result.filePath,
              messages: result.messages,
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

  return violations;
};
