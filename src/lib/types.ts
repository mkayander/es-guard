import type { Linter } from "eslint";

export type Violation = {
  file: string;
  messages: Linter.LintMessage[];
};

export type Config = {
  dir: string;
  target: string;
  browsers?: string;
};

export type CLIOptions = {
  dir: string;
  target: string;
  browsers?: string;
  help: boolean;
  version: boolean;
};
