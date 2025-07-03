import * as fs from "fs";
import type { Config } from "./types.js";

export const validateConfig = (config: Config): void => {
  if (!fs.existsSync(config.dir)) {
    throw new Error(`Output directory "${config.dir}" does not exist. Please build the project first.`);
  }

  if (!config.target) {
    throw new Error("Target ES version is required");
  }
};
