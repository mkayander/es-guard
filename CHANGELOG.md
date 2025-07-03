# 1.0.0 (2025-07-03)


### Features

* Add coverage reporting and update dependencies in package.json and pnpm-lock.yaml. Enhance README with Codecov badge and improve Vitest configuration for coverage reporting. Update GitHub Actions workflow to include coverage step. ([138576f](https://github.com/mkayander/es-guard/commit/138576f197fd57043f60181e0b5c8db3cd0e51cd))
* Add Prettier configuration, GitHub Actions workflow for testing, and update linting scripts in package.json. Introduce .prettierignore and .prettierrc files for code formatting control. ([7d1acd4](https://github.com/mkayander/es-guard/commit/7d1acd49b428a1c61d399011509212df3ca683e1))
* Enhance compatibility checks by improving ESLint mocking in tests and adding validation tests for configuration. Update coverage exclusions in vitest.config.ts to include additional files. ([bd84a7c](https://github.com/mkayander/es-guard/commit/bd84a7c895db8f5be249b31f5f42670cf3d6d757))
* Initial commit of ES-Guard, a TypeScript-based tool for checking JavaScript compatibility with target environments. Added core functionality, ESLint configuration, CLI interface, and tests. ([9ffa6fe](https://github.com/mkayander/es-guard/commit/9ffa6fe174d7b5fb9a59e6976b710b59ef2829ae))
* Integrate Commander.js for improved CLI argument parsing and add validation for ES target formats. Update package.json and pnpm-lock.yaml to include Commander dependency. Enhance CLI tests to cover new functionality and error handling. ([7c934af](https://github.com/mkayander/es-guard/commit/7c934af2a512873a3ca5f303d0190d949ddae150))
* Integrate semantic-release for automated versioning and changelog generation. Update package.json and pnpm-lock.yaml to include semantic-release dependencies. Add release configuration and GitHub Actions workflow for CI/CD integration. ([4026597](https://github.com/mkayander/es-guard/commit/4026597371b6177f6cf4f7eb18d872f059d6dc1f))
* Introduce auto browser detection feature and enhance CLI options for ES version compatibility. Update README and tests to reflect new functionality, allowing users to omit browser targets for automatic determination based on ES version. ([7489016](https://github.com/mkayander/es-guard/commit/74890161fa9c45f8969f01c74b3b905ddcbe8fae))
