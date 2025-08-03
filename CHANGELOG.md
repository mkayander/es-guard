# [1.11.0](https://github.com/mkayander/es-guard/compare/v1.10.0...v1.11.0) (2025-08-03)


### Features

* Enhance global state management and add detection result type ([3deddeb](https://github.com/mkayander/es-guard/commit/3deddebc601efdacc4bfe62d8d7ecd9340245b67))

# [1.10.0](https://github.com/mkayander/es-guard/compare/v1.9.0...v1.10.0) (2025-08-02)


### Features

* Enhance package.json and documentation for programmatic API ([6d18251](https://github.com/mkayander/es-guard/commit/6d182518d798306af19a23ac157394f975687949))

# [1.9.0](https://github.com/mkayander/es-guard/compare/v1.8.0...v1.9.0) (2025-08-02)


### Features

* Add --skip option to CLI for compatibility error handling ([4fc5e4c](https://github.com/mkayander/es-guard/commit/4fc5e4c870f25fc03d89996777bd40002655e96d))

# [1.8.0](https://github.com/mkayander/es-guard/compare/v1.7.0...v1.8.0) (2025-08-02)


### Bug Fixes

* Update ESLint rules for stricter type checks and improve type imports ([4dd5a71](https://github.com/mkayander/es-guard/commit/4dd5a71ba21f7869abba882f4bcff0a15cd2b2b4))


### Features

* Enhance project type detection and default configurations ([39ce323](https://github.com/mkayander/es-guard/commit/39ce323480427aaf1aae8eeee1a79ebb0907e9a9))
* Restructure project type detection and configuration handling ([2cd7f69](https://github.com/mkayander/es-guard/commit/2cd7f69b98109e54bc230e87799ed8b3732051ca))

# [1.7.0](https://github.com/mkayander/es-guard/compare/v1.6.0...v1.7.0) (2025-08-02)


### Features

* Enhance CLI configuration detection and update test cases ([4f417b0](https://github.com/mkayander/es-guard/commit/4f417b045b12776d814db4abcbc024b4e606f7ce))

# [1.6.0](https://github.com/mkayander/es-guard/compare/v1.5.0...v1.6.0) (2025-08-02)


### Features

* Add alias for CLI command in package.json ([5b77c73](https://github.com/mkayander/es-guard/commit/5b77c734a7ee68e8bc0b7f1983f8a4fd7e11ef89))

# [1.5.0](https://github.com/mkayander/es-guard/compare/v1.4.0...v1.5.0) (2025-07-08)


### Bug Fixes

* Improve formatting of violation messages for better readability ([d2eb082](https://github.com/mkayander/es-guard/commit/d2eb08232cddce87feb649b0131422769ab3abcd))
* Suppress ESLint warning for unused variable in formatViolationMessage ([0b0cdac](https://github.com/mkayander/es-guard/commit/0b0cdacab52090ec9aed9df9edd6b4cfea357a80))


### Features

* Add chalk for improved message formatting in compatibility checks ([fe1066e](https://github.com/mkayander/es-guard/commit/fe1066e9872ddf584797aa45268fa78dd5d6bd76))
* Add source map support and enhance error messaging in compatibility checks ([8c087af](https://github.com/mkayander/es-guard/commit/8c087af37172d09dbba50c9b3b201e8886d5d183))
* Integrate @babel/code-frame for enhanced error reporting ([932abdc](https://github.com/mkayander/es-guard/commit/932abdc785093118d8fb431cdbf1e2de07e12b36))

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
