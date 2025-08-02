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
};

export type ProjectType = "nextjs" | "vite" | "webpack" | "rollup" | "parcel" | "generic";
