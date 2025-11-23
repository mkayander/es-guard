import { describe, expect, test } from "vitest";

import { pluralize } from "./pluralize.js";

describe("pluralize", () => {
  test("should return singular form for count of 1", () => {
    expect(pluralize("error", 1)).toBe("error");
    expect(pluralize("warning", 1)).toBe("warning");
    expect(pluralize("file", 1)).toBe("file");
  });

  test("should return plural form for count of 0", () => {
    expect(pluralize("error", 0)).toBe("errors");
    expect(pluralize("warning", 0)).toBe("warnings");
    expect(pluralize("file", 0)).toBe("files");
  });

  test("should return plural form for count greater than 1", () => {
    expect(pluralize("error", 2)).toBe("errors");
    expect(pluralize("error", 5)).toBe("errors");
    expect(pluralize("warning", 10)).toBe("warnings");
    expect(pluralize("file", 100)).toBe("files");
  });

  test("should handle words ending in 's'", () => {
    expect(pluralize("class", 1)).toBe("class");
    expect(pluralize("class", 2)).toBe("classs");
  });

  test("should handle empty strings", () => {
    expect(pluralize("", 1)).toBe("");
    expect(pluralize("", 2)).toBe("s");
  });
});
