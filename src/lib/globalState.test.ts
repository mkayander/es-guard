import * as fs from "fs";
import * as path from "path";
import { beforeEach, describe, expect, it } from "vitest";

import {
  getGlobalState,
  getProjectType,
  isProjectTypeDetected,
  resetGlobalState,
  setDebugMode,
  setGlobalState,
  setProjectType,
  setVerboseMode,
} from "./globalState.js";
import { detectAndCacheProjectType, getCurrentProjectType } from "./projectType.js";

describe("globalState", () => {
  beforeEach(() => {
    resetGlobalState();
  });

  describe("basic state management", () => {
    it("should set and get verbose mode", () => {
      setVerboseMode(true);
      expect(getGlobalState().verbose).toBe(true);
    });

    it("should set and get debug mode", () => {
      setDebugMode(true);
      expect(getGlobalState().debug).toBe(true);
    });

    it("should set multiple state options at once", () => {
      setGlobalState({ verbose: true, debug: true });
      const state = getGlobalState();
      expect(state.verbose).toBe(true);
      expect(state.debug).toBe(true);
    });

    it("should reset state to defaults", () => {
      setVerboseMode(true);
      setDebugMode(true);
      resetGlobalState();
      const state = getGlobalState();
      expect(state.verbose).toBe(false);
      expect(state.debug).toBe(false);
      expect(state.projectType).toBeUndefined();
      expect(state.projectTypeDetected).toBe(false);
    });
  });

  describe("project type management", () => {
    it("should set and get project type", () => {
      setProjectType("nextjs");
      expect(getProjectType()).toBe("nextjs");
      expect(isProjectTypeDetected()).toBe(true);
    });

    it("should track detection status", () => {
      expect(isProjectTypeDetected()).toBe(false);
      setProjectType("vite");
      expect(isProjectTypeDetected()).toBe(true);
    });

    it("should include project type in global state", () => {
      setProjectType("webpack");
      const state = getGlobalState();
      expect(state.projectType).toBe("webpack");
      expect(state.projectTypeDetected).toBe(true);
    });

    it("should reset project type on reset", () => {
      setProjectType("nextjs");
      resetGlobalState();
      expect(getProjectType()).toBeUndefined();
      expect(isProjectTypeDetected()).toBe(false);
    });
  });

  describe("project type detection integration", () => {
    it("should detect project type and cache it globally", () => {
      // Create a temporary package.json for testing
      const tempDir = fs.mkdtempSync("es-guard-test-");
      const packageJsonPath = path.join(tempDir, "package.json");

      try {
        fs.writeFileSync(
          packageJsonPath,
          JSON.stringify({
            name: "test-project",
            dependencies: {
              next: "^13.0.0",
            },
          }),
        );

        // Change to temp directory and detect project type
        const originalCwd = process.cwd();
        process.chdir(tempDir);

        try {
          const detectedType = detectAndCacheProjectType();
          expect(detectedType).toBe("nextjs");
          expect(getProjectType()).toBe("nextjs");
          expect(isProjectTypeDetected()).toBe(true);
        } finally {
          process.chdir(originalCwd);
        }
      } finally {
        // Cleanup
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should return cached result on subsequent calls", () => {
      // Create a temporary package.json for testing
      const tempDir = fs.mkdtempSync("es-guard-test-");
      const packageJsonPath = path.join(tempDir, "package.json");

      try {
        fs.writeFileSync(
          packageJsonPath,
          JSON.stringify({
            name: "test-project",
            dependencies: {
              vite: "^4.0.0",
            },
          }),
        );

        // Change to temp directory and detect project type
        const originalCwd = process.cwd();
        process.chdir(tempDir);

        try {
          // First call should detect and cache
          const firstCall = detectAndCacheProjectType();
          expect(firstCall).toBe("vite");

          // Modify package.json to change project type
          fs.writeFileSync(
            "package.json",
            JSON.stringify({
              name: "test-project",
              dependencies: {
                webpack: "^5.0.0",
              },
            }),
          );

          // Second call should return cached result
          const secondCall = detectAndCacheProjectType();
          expect(secondCall).toBe("vite"); // Should still be cached

          // Reset and detect again
          resetGlobalState();
          const thirdCall = detectAndCacheProjectType();
          expect(thirdCall).toBe("webpack"); // Should detect new type
        } finally {
          process.chdir(originalCwd);
        }
      } finally {
        // Cleanup
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should return null when no package.json exists", () => {
      const tempDir = fs.mkdtempSync("es-guard-test-");

      try {
        const originalCwd = process.cwd();
        process.chdir(tempDir);

        try {
          const detectedType = detectAndCacheProjectType();
          expect(detectedType).toBeNull();
          expect(getProjectType()).toBeUndefined();
          expect(isProjectTypeDetected()).toBe(false);
        } finally {
          process.chdir(originalCwd);
        }
      } finally {
        // Cleanup
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should provide convenient access via getCurrentProjectType", () => {
      setProjectType("rollup");
      const projectType = getCurrentProjectType();
      expect(projectType).toBe("rollup");
    });
  });
});
