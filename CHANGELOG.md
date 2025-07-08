# [1.4.0](https://github.com/mkayander/es-guard/compare/v1.3.0...v1.4.0) (2025-07-08)


### Features

* Enhance CLI functionality and compatibility checks ([b3024c2](https://github.com/mkayander/es-guard/commit/b3024c2f17f0d3a4c94675c0bc86e8fc4b83fe88))

# [1.3.0](https://github.com/mkayander/es-guard/compare/v1.2.0...v1.3.0) (2025-07-08)


### Features

* Enhance compatibility and target detection tests ([ab24ce3](https://github.com/mkayander/es-guard/commit/ab24ce35a309441684bdb33ebf74235b6fd5e9ad))

# [1.2.0](https://github.com/mkayander/es-guard/compare/v1.1.0...v1.2.0) (2025-07-03)


### Features

* Add JUnit test reporting and coverage options to package.json scripts and update CI workflow to utilize new test commands for improved test output and coverage tracking. ([d479112](https://github.com/mkayander/es-guard/commit/d479112243d36b044bfe9bb011bd37e990fd7810))

# [1.1.0](https://github.com/mkayander/es-guard/compare/v1.0.0...v1.1.0) (2025-07-03)


### Features

* Enhance JSON file parsing with type guards for package.json, tsconfig.json, and .babelrc. Add warnings for invalid configurations to improve error handling and user feedback. ([9c6a4fd](https://github.com/mkayander/es-guard/commit/9c6a4fd56f41552fa7b752174d83b5983ecb705a))
* Remove .npmignore file to streamline package publishing process and eliminate unnecessary exclusions. ([8d36a64](https://github.com/mkayander/es-guard/commit/8d36a645816fadd9bbb0c7678d99db28ba44fc06))

# 1.0.0 (2025-07-03)


### Features

* Add coverage reporting and update dependencies in package.json and pnpm-lock.yaml. Enhance README with Codecov badge and improve Vitest configuration for coverage reporting. Update GitHub Actions workflow to include coverage step. ([138576f](https://github.com/mkayander/es-guard/commit/138576f197fd57043f60181e0b5c8db3cd0e51cd))
* Add Prettier configuration, GitHub Actions workflow for testing, and update linting scripts in package.json. Introduce .prettierignore and .prettierrc files for code formatting control. ([7d1acd4](https://github.com/mkayander/es-guard/commit/7d1acd49b428a1c61d399011509212df3ca683e1))
* Enhance compatibility checks by improving ESLint mocking in tests and adding validation tests for configuration. Update coverage exclusions in vitest.config.ts to include additional files. ([bd84a7c](https://github.com/mkayander/es-guard/commit/bd84a7c895db8f5be249b31f5f42670cf3d6d757))
* Initial commit of ES-Guard, a TypeScript-based tool for checking JavaScript compatibility with target environments. Added core functionality, ESLint configuration, CLI interface, and tests. ([9ffa6fe](https://github.com/mkayander/es-guard/commit/9ffa6fe174d7b5fb9a59e6976b710b59ef2829ae))
* Integrate Commander.js for improved CLI argument parsing and add validation for ES target formats. Update package.json and pnpm-lock.yaml to include Commander dependency. Enhance CLI tests to cover new functionality and error handling. ([7c934af](https://github.com/mkayander/es-guard/commit/7c934af2a512873a3ca5f303d0190d949ddae150))
* Integrate semantic-release for automated versioning and changelog generation. Update package.json and pnpm-lock.yaml to include semantic-release dependencies. Add release configuration and GitHub Actions workflow for CI/CD integration. ([4026597](https://github.com/mkayander/es-guard/commit/4026597371b6177f6cf4f7eb18d872f059d6dc1f))
* Introduce auto browser detection feature and enhance CLI options for ES version compatibility. Update README and tests to reflect new functionality, allowing users to omit browser targets for automatic determination based on ES version. ([7489016](https://github.com/mkayander/es-guard/commit/74890161fa9c45f8969f01c74b3b905ddcbe8fae))
