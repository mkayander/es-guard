import * as fs from "fs";
import * as path from "path";
import { beforeEach, describe, expect, it } from "vitest";

import { resetGlobalState } from "./globalState.js";
import { detectAndCacheProjectType, getCurrentProjectType } from "./projectType.js";

describe("projectType", () => {
  beforeEach(() => {
    resetGlobalState();
  });

  describe("detectAndCacheProjectType", () => {
    it("should detect Next.js project type", () => {
      const tempDir = fs.mkdtempSync("es-guard-test-");

      try {
        fs.writeFileSync(
          path.join(tempDir, "package.json"),
          JSON.stringify({
            name: "test-project",
            dependencies: {
              next: "^13.0.0",
            },
          }),
        );

        const originalCwd = process.cwd();
        process.chdir(tempDir);

        try {
          const detectedType = detectAndCacheProjectType();
          expect(detectedType).toBe("nextjs");
        } finally {
          process.chdir(originalCwd);
        }
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should detect Vite project type", () => {
      const tempDir = fs.mkdtempSync("es-guard-test-");

      try {
        fs.writeFileSync(
          path.join(tempDir, "package.json"),
          JSON.stringify({
            name: "test-project",
            dependencies: {
              vite: "^4.0.0",
            },
          }),
        );

        const originalCwd = process.cwd();
        process.chdir(tempDir);

        try {
          const detectedType = detectAndCacheProjectType();
          expect(detectedType).toBe("vite");
        } finally {
          process.chdir(originalCwd);
        }
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should detect Webpack project type", () => {
      const tempDir = fs.mkdtempSync("es-guard-test-");

      try {
        fs.writeFileSync(
          path.join(tempDir, "package.json"),
          JSON.stringify({
            name: "test-project",
            devDependencies: {
              webpack: "^5.0.0",
            },
          }),
        );

        const originalCwd = process.cwd();
        process.chdir(tempDir);

        try {
          const detectedType = detectAndCacheProjectType();
          expect(detectedType).toBe("webpack");
        } finally {
          process.chdir(originalCwd);
        }
      } finally {
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
        } finally {
          process.chdir(originalCwd);
        }
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should return null when package.json has no dependencies", () => {
      const tempDir = fs.mkdtempSync("es-guard-test-");

      try {
        fs.writeFileSync(
          path.join(tempDir, "package.json"),
          JSON.stringify({
            name: "test-project",
          }),
        );

        const originalCwd = process.cwd();
        process.chdir(tempDir);

        try {
          const detectedType = detectAndCacheProjectType();
          expect(detectedType).toBe("generic");
        } finally {
          process.chdir(originalCwd);
        }
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should handle malformed package.json gracefully", () => {
      const tempDir = fs.mkdtempSync("es-guard-test-");

      try {
        fs.writeFileSync(path.join(tempDir, "package.json"), "{ invalid json");

        const originalCwd = process.cwd();
        process.chdir(tempDir);

        try {
          const detectedType = detectAndCacheProjectType();
          expect(detectedType).toBeNull();
        } finally {
          process.chdir(originalCwd);
        }
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("getCurrentProjectType", () => {
    it("should return detected project type", () => {
      const tempDir = fs.mkdtempSync("es-guard-test-");

      try {
        fs.writeFileSync(
          path.join(tempDir, "package.json"),
          JSON.stringify({
            name: "test-project",
            dependencies: {
              rollup: "^3.0.0",
            },
          }),
        );

        const originalCwd = process.cwd();
        process.chdir(tempDir);

        try {
          const projectType = getCurrentProjectType();
          expect(projectType).toBe("rollup");
        } finally {
          process.chdir(originalCwd);
        }
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should return generic when no project type detected", () => {
      const tempDir = fs.mkdtempSync("es-guard-test-");

      try {
        const originalCwd = process.cwd();
        process.chdir(tempDir);

        try {
          const projectType = getCurrentProjectType();
          expect(projectType).toBe("generic");
        } finally {
          process.chdir(originalCwd);
        }
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });
});
