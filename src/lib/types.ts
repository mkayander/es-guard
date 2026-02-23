import type { Linter } from "eslint";

export type SourceMappedMessage = Linter.LintMessage & {
  originalFile?: string;
  originalLine?: number;
  originalColumn?: number;
};

export type Violation = {
  file: string;
  messages: Linter.LintMessage[];
  sourceMappedMessages?: SourceMappedMessage[];
};

export type Config = {
  dir: string;
  target: string;
  browsers?: string;
  /** When true, disables compat/compat rule - only syntax errors will be reported */
  skipCompatWarnings?: boolean;
};

export type ProjectType = "nextjs" | "vite" | "webpack" | "rollup" | "parcel" | "generic";

// Programmatic interface types
export interface ESGuardOptions {
  target?: string;
  browsers?: string;
  verbose?: boolean;
  skip?: boolean;
  /** When true, disables compat/compat rule - only syntax errors will be reported */
  skipCompatWarnings?: boolean;
  directory?: string;
  workingDir?: string;
}

export interface ESGuardResult {
  success: boolean;
  errors: Violation[];
  warnings: Violation[];
  scanDirectory: string;
  target: string;
  browserTargets: string;
}
