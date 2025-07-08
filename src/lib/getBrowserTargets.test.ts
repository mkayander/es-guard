import { describe, test, expect } from "vitest";
import { getBrowserTargetsFromString } from "../lib/getBrowserTargets.js";

describe("getBrowserTargetsFromString", () => {
  describe("Year-based ES versions", () => {
    test("should return IE11 support for ES2015", () => {
      const result = getBrowserTargetsFromString("2015");
      expect(result).toBe("> 1%, last 2 versions, not dead, ie 11");
    });

    test("should exclude IE11 for ES2016", () => {
      const result = getBrowserTargetsFromString("2016");
      expect(result).toBe("> 1%, last 2 versions, not dead, not ie 11");
    });

    test("should exclude IE11 for ES2017", () => {
      const result = getBrowserTargetsFromString("2017");
      expect(result).toBe("> 1%, last 2 versions, not dead, not ie 11");
    });

    test("should exclude IE11 and Opera Mini for ES2018", () => {
      const result = getBrowserTargetsFromString("2018");
      expect(result).toBe("> 1%, last 2 versions, not dead, not ie 11, not op_mini all");
    });

    test("should exclude IE11 and Opera Mini for ES2019", () => {
      const result = getBrowserTargetsFromString("2019");
      expect(result).toBe("> 1%, last 2 versions, not dead, not ie 11, not op_mini all");
    });

    test("should exclude IE11, Opera Mini, and old Android for ES2020+", () => {
      const result = getBrowserTargetsFromString("2020");
      expect(result).toBe("> 1%, last 2 versions, not dead, not ie 11, not op_mini all, not android < 67");
    });
  });

  describe("Numeric ES versions", () => {
    test("should support ES3", () => {
      const result = getBrowserTargetsFromString("3");
      expect(result).toBe("> 0.1%, ie 6");
    });

    test("should support ES5", () => {
      const result = getBrowserTargetsFromString("5");
      expect(result).toBe("> 0.5%, ie 8");
    });

    test("should support ES6 (equivalent to ES2015)", () => {
      const result = getBrowserTargetsFromString("6");
      expect(result).toBe("> 1%, last 2 versions, not dead, ie 11");
    });

    test("should support ES7 (equivalent to ES2016)", () => {
      const result = getBrowserTargetsFromString("7");
      expect(result).toBe("> 1%, last 2 versions, not dead, not ie 11");
    });

    test("should support ES11 (equivalent to ES2020)", () => {
      const result = getBrowserTargetsFromString("11");
      expect(result).toBe("> 1%, last 2 versions, not dead, not ie 11, not op_mini all, not android < 67");
    });
  });

  describe("Special cases", () => {
    test("should handle 'latest' target", () => {
      const result = getBrowserTargetsFromString("latest");
      expect(result).toBe("> 1%, last 2 versions, not dead, not ie 11, not op_mini all, not android < 67");
    });

    test("should use latest targets for future ES versions", () => {
      const result = getBrowserTargetsFromString("2030");
      expect(result).toBe("> 1%, last 2 versions, not dead");
    });

    test("should handle invalid target gracefully", () => {
      const result = getBrowserTargetsFromString("invalid");
      expect(result).toBe("> 1%, last 2 versions, not dead");
    });

    test("should handle empty string gracefully", () => {
      const result = getBrowserTargetsFromString("");
      expect(result).toBe("> 1%, last 2 versions, not dead");
    });
  });

  describe("Conversion between year and numeric versions", () => {
    test("should handle year that converts to numeric version", () => {
      // 2015 should map to ES6 if numeric lookup fails
      const result = getBrowserTargetsFromString("2015");
      expect(result).toBe("> 1%, last 2 versions, not dead, ie 11");
    });

    test("should handle year that doesn't have direct mapping", () => {
      // This should fall back to default
      const result = getBrowserTargetsFromString("1999");
      expect(result).toBe("> 1%, last 2 versions, not dead");
    });
  });
});
