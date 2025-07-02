export type Violation = {
  file: string;
  messages: any[];
};

export type Config = {
  dir: string;
  target: string;
  browsers: string;
};

export type CLIOptions = {
  dir: string;
  target: string;
  browsers: string;
  help: boolean;
  version: boolean;
};
