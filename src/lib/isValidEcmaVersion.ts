import type { Linter } from "eslint";

const validVersions = new Set([
  3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
  2026,
]);

export const isValidEcmaVersion = (ecmaVersion?: number | string | null): ecmaVersion is Linter.EcmaVersion => {
  if (!ecmaVersion) {
    return false;
  }

  if (typeof ecmaVersion === "string") {
    return ecmaVersion === "latest";
  }

  return validVersions.has(ecmaVersion);
};
