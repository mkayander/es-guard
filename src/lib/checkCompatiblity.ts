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

  const eslint = new ESLint(createESLintConfig(config.target, config.browsers));
  const violations: Violation[] = [];

  for (const file of jsFiles) {
    try {
      const results = await eslint.lintFiles([file]);

      for (const result of results) {
        if (result.messages.length > 0) {
          violations.push({
            file: result.filePath,
            messages: result.messages,
          });
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not lint file ${file}:`, error);
    }
  }

  return violations;
};
