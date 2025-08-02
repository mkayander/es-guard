import { describe, it, expect } from "vitest";
import {
  NEXTJS_DEFAULT_BROWSERSLIST,
  DEFAULT_OUTPUT_DIRS,
  PROJECT_TYPES,
  getDefaultBrowserslist,
  getDefaultOutputDir,
  detectProjectType,
} from "./defaults.js";

describe("defaults", () => {
  describe("constants", () => {
    it("should export Next.js default browserslist", () => {
      expect(NEXTJS_DEFAULT_BROWSERSLIST).toEqual(["chrome 64", "edge 79", "firefox 67", "opera 51", "safari 12"]);
    });

    it("should export default output directories", () => {
      expect(DEFAULT_OUTPUT_DIRS.NEXTJS).toBe(".next/static");
      expect(DEFAULT_OUTPUT_DIRS.VITE).toBe("dist");
      expect(DEFAULT_OUTPUT_DIRS.WEBPACK).toBe("dist");
      expect(DEFAULT_OUTPUT_DIRS.ROLLUP).toBe("dist");
      expect(DEFAULT_OUTPUT_DIRS.PARCEL).toBe("dist");
      expect(DEFAULT_OUTPUT_DIRS.GENERIC).toBe("dist");
    });

    it("should export project types", () => {
      expect(PROJECT_TYPES.NEXTJS).toBe("nextjs");
      expect(PROJECT_TYPES.VITE).toBe("vite");
      expect(PROJECT_TYPES.WEBPACK).toBe("webpack");
      expect(PROJECT_TYPES.ROLLUP).toBe("rollup");
      expect(PROJECT_TYPES.PARCEL).toBe("parcel");
      expect(PROJECT_TYPES.GENERIC).toBe("generic");
    });
  });

  describe("getDefaultBrowserslist", () => {
    it("should return Next.js default browserslist for nextjs project type", () => {
      const result = getDefaultBrowserslist("nextjs");
      expect(result).toEqual([...NEXTJS_DEFAULT_BROWSERSLIST]);
    });

    it("should return null for unknown project types", () => {
      expect(getDefaultBrowserslist("unknown")).toBeNull();
      expect(getDefaultBrowserslist("vite")).toBeNull();
      expect(getDefaultBrowserslist("webpack")).toBeNull();
    });
  });

  describe("getDefaultOutputDir", () => {
    it("should return correct default output directories for each project type", () => {
      expect(getDefaultOutputDir("nextjs")).toBe(".next/static");
      expect(getDefaultOutputDir("vite")).toBe("dist");
      expect(getDefaultOutputDir("webpack")).toBe("dist");
      expect(getDefaultOutputDir("rollup")).toBe("dist");
      expect(getDefaultOutputDir("parcel")).toBe("dist");
      expect(getDefaultOutputDir("generic")).toBe("dist");
    });

    it("should return generic default for unknown project types", () => {
      expect(getDefaultOutputDir("unknown")).toBe("dist");
    });
  });

  describe("detectProjectType", () => {
    it("should detect Next.js project from dependencies", () => {
      const result = detectProjectType({ next: "^13.0.0" });
      expect(result).toBe("nextjs");
    });

    it("should detect Next.js project from devDependencies", () => {
      const result = detectProjectType({}, { next: "^13.0.0" });
      expect(result).toBe("nextjs");
    });

    it("should detect Vite project", () => {
      const result = detectProjectType({ vite: "^4.0.0" });
      expect(result).toBe("vite");
    });

    it("should detect Webpack project", () => {
      const result = detectProjectType({ webpack: "^5.0.0" });
      expect(result).toBe("webpack");
    });

    it("should detect Rollup project", () => {
      const result = detectProjectType({ rollup: "^3.0.0" });
      expect(result).toBe("rollup");
    });

    it("should detect Parcel project", () => {
      const result = detectProjectType({ parcel: "^2.0.0" });
      expect(result).toBe("parcel");
    });

    it("should return generic for projects without known build tools", () => {
      const result = detectProjectType({ react: "^18.0.0" });
      expect(result).toBe("generic");
    });

    it("should check project types in priority order (next > vite > webpack > rollup > parcel)", () => {
      const result = detectProjectType({ vite: "^4.0.0" }, { next: "^13.0.0" });
      expect(result).toBe("nextjs");
    });

    it("should handle empty dependencies", () => {
      const result = detectProjectType();
      expect(result).toBe("generic");
    });
  });
});
