# ES-Guard

[![codecov](https://codecov.io/gh/mkayander/es-guard/branch/main/graph/badge.svg)](https://codecov.io/gh/mkayander/es-guard)

A powerful TypeScript-based tool that ensures your JavaScript code is compatible with target environments using ESLint.

## Features

- 🔍 **ES Version Validation**: Verify your JavaScript code compatibility with specific ES versions (ES2015, ES2016, ES2017, and beyond)
- 🌐 **Browser Support Verification**: Validate browser compatibility using eslint-plugin-compat
- 🎯 **Smart Browser Detection**: Automatically determine browser targets from ES version (optional)
- 📁 **Comprehensive Directory Scanning**: Effortlessly scan directories for JavaScript files
- 🚀 **GitHub Actions Integration**: Seamlessly integrate with GitHub Actions workflows
- 📦 **Flexible Installation**: Install globally or use as a project dependency
- 🗂️ **Temp Folder Support**: Run from any directory while detecting config from project root

## Installation

### Global Installation

```bash
npm install -g es-guard
```

### Local Installation

```bash
npm install --save-dev es-guard
```

### From Source

```bash
git clone https://github.com/mkayander/es-guard.git
cd es-guard
npm install
npm run build
```

## Usage

### Command Line Interface

```bash
# Basic usage with auto-detected browsers
es-guard

# Validate specific directory
es-guard build

# Specify target ES version (year format)
es-guard -t 2020 build

# Specify target ES version (numeric format)
es-guard -t 11 build

# Use latest ES version
es-guard -t latest build

# Specify custom browser targets
es-guard --browsers "> 0.5%, last 2 versions, Firefox ESR, not dead" dist

# Run from any directory using --projectDir to specify project root
es-guard -p /path/to/project
es-guard --projectDir /path/to/project
es-guard -p /path/to/project build

# Display help information
es-guard --help

# Show version information
es-guard --version
```

### Programmatic Usage

ES-Guard provides a comprehensive programmatic API for integration into your build tools, CI/CD pipelines, or custom scripts.

#### Basic Usage

```typescript
import { checkCompatibility } from "es-guard";

// Basic compatibility check
const result = await checkCompatibility({
  dir: "dist",
  target: "2020",
});

console.log(`Found ${result.errors.length} errors and ${result.warnings.length} warnings`);
```

#### Auto-detection

```typescript
import { checkCompatibility, detectProjectConfig } from "es-guard";

// Auto-detect project configuration
const config = detectProjectConfig(process.cwd());

if (config.target && config.outputDir) {
  const result = await checkCompatibility({
    dir: config.outputDir,
    target: config.target,
    browsers: config.browserslist?.join(", "),
  });
}
```

#### Temp Folder / Remote Project Usage

```typescript
import { checkCompatibility, detectProjectConfig } from "es-guard";
import path from "path";

// Run from any directory while checking a different project
const projectRoot = "/path/to/actual/project";
const tempWorkingDir = "/tmp/build-check";

// Detect configuration from the actual project directory
const config = detectProjectConfig(projectRoot);

if (config.target && config.outputDir) {
  // Resolve output directory relative to project root
  const outputDir = path.isAbsolute(config.outputDir) ? config.outputDir : path.join(projectRoot, config.outputDir);

  const result = await checkCompatibility({
    dir: outputDir,
    target: config.target,
    browsers: config.browserslist?.join(", "),
  });
}
```

#### CI/CD Pipeline Usage

```typescript
import { checkCompatibility, detectProjectConfig } from "es-guard";

// Running in CI where working directory might be different
const projectRoot = process.env.PROJECT_ROOT || process.cwd();
const buildDir = process.env.BUILD_DIR || "dist";

// Detect configuration from project root
const config = detectProjectConfig(projectRoot);

if (config.target) {
  const scanDir = config.outputDir || buildDir;
  const fullScanPath = path.isAbsolute(scanDir) ? scanDir : path.join(projectRoot, scanDir);

  const result = await checkCompatibility({
    dir: fullScanPath,
    target: config.target,
    browsers: config.browserslist?.join(", "),
  });

  // In CI, exit with error code if issues found
  if (result.errors.length > 0) {
    process.exit(1);
  }
}
```

#### Advanced Usage

```typescript
import { checkCompatibility, getBrowserTargetsFromString, validateConfig, setVerboseMode } from "es-guard";

// Validate configuration
validateConfig({
  dir: "dist",
  target: "2020",
});

// Get browser targets for specific ES version
const browsers = getBrowserTargetsFromString("2015");

// Enable verbose mode for detailed output
setVerboseMode(true);

// Run compatibility check
const result = await checkCompatibility({
  dir: "dist",
  target: "2020",
  browsers: "> 1%, last 2 versions, not dead, ie 11",
});

// Process results
result.errors.forEach((violation) => {
  console.log(`Error in ${violation.file}:`);
  violation.messages.forEach((message) => {
    console.log(`  Line ${message.line}: ${message.message}`);
  });
});
```

#### TypeScript Support

ES-Guard includes full TypeScript support with proper type definitions:

```typescript
import type { Config, CompatibilityResult, Violation } from "es-guard";

const config: Config = {
  dir: "dist",
  target: "2020",
  browsers: "> 1%, last 2 versions, not dead",
};

const result: CompatibilityResult = await checkCompatibility(config);
```

See the [examples](./examples/) directory for more comprehensive usage examples.

### GitHub Actions Integration

```yaml
name: Validate Compatibility
on: [push, pull_request]

jobs:
  compatibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm install
      - run: npm run build
      - run: npx es-guard -t 2015 dist
```

## Configuration

### Parameters

| Parameter  | Description                                | Default                   | Required |
| ---------- | ------------------------------------------ | ------------------------- | -------- |
| `path`     | Directory to scan for JavaScript files     | `dist`                    | No       |
| `target`   | Target ES version                          | `2015`                    | Yes      |
| `browsers` | Browser targets for compatibility checking | Auto-detected from target | No       |

### CLI Options

| Option                         | Description                            | Default                   |
| ------------------------------ | -------------------------------------- | ------------------------- |
| `-t, --target <version>`       | Target ES version                      | Auto-detected             |
| `-b, --browsers <targets>`     | Browser targets                        | Auto-detected             |
| `-p, --projectDir <directory>` | Project directory for config detection | Current working directory |
| `-v, --verbose`                | Enable verbose output                  | `false`                   |
| `--skip`                       | Continue on compatibility errors       | `false`                   |

### ES Target Versions

The `target` parameter supports multiple formats:

- **Year format**: `2015`, `2016`, `2017`, etc.
- **Numeric format**: `6` (ES2015), `7` (ES2016), `11` (ES2020), etc.
- **Latest**: `latest` for the most recent ES version

### Browser Targets

The `browsers` parameter follows the Browserslist format. When not specified, browsers are automatically determined based on the ES target:

- **ES2015/ES6**: `> 1%, last 2 versions, not dead, ie 11`
- **ES2016-2017/ES7-8**: `> 1%, last 2 versions, not dead, not ie 11`
- **ES2018-2019/ES9-10**: `> 1%, last 2 versions, not dead, not ie 11, not op_mini all`
- **ES2020+/ES11+**: `> 1%, last 2 versions, not dead, not ie 11, not op_mini all, not android < 67`

Custom browser target examples:

- `> 1%, last 2 versions, not dead, ie 11` - Modern browsers with IE11 support
- `> 0.5%, last 2 versions, Firefox ESR, not dead` - Broader browser support
- `defaults` - Default Browserslist targets
- `last 1 version` - Latest version of each browser

## Temp Folder & Remote Project Support

ES-Guard supports running from any directory while detecting configuration from a different project root. This is particularly useful for:

- **CI/CD Pipelines**: Run compatibility checks from build containers
- **Build Scripts**: Execute from temp directories during build processes
- **Multi-Project Validation**: Check multiple projects from a single location
- **Remote Execution**: Run checks from different working directories

### CLI Usage

```bash
# Run from any directory while using config from /path/to/project
es-guard --cwd /path/to/project

# Check specific build directory using project config
es-guard --cwd /path/to/project build

# Use verbose mode to see working directory information
es-guard --cwd /path/to/project --verbose
```

### Programmatic Usage

```typescript
import { detectProjectConfig, checkCompatibility } from "es-guard";

// Detect config from project root (can be different from current working directory)
const config = detectProjectConfig("/path/to/project");

if (config.target && config.outputDir) {
  // Resolve paths relative to project root
  const outputDir = path.isAbsolute(config.outputDir)
    ? config.outputDir
    : path.join("/path/to/project", config.outputDir);

  const result = await checkCompatibility({
    dir: outputDir,
    target: config.target,
    browsers: config.browserslist?.join(", "),
  });
}
```

### Use Cases

1. **Build Containers**: Run compatibility checks from Docker containers with mounted project directories
2. **CI/CD Pipelines**: Execute checks from different working directories in automated workflows
3. **Multi-Project Monorepos**: Validate multiple projects from a single script location
4. **Remote Build Servers**: Run checks on remote servers while maintaining local project configuration
5. **Temp Build Directories**: Execute from temporary directories during build processes

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Testing

```bash
npm test
npm run test
```

### Linting

```bash
npm run lint
```

## Publishing to NPM

1. Update the version in `package.json`
2. Update the repository URL in `package.json`
3. Build the project: `npm run build`
4. Publish: `npm publish`

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests where applicable
5. Run the linter: `npm run lint`
6. Submit a pull request

## Support

- 📖 [Documentation](https://github.com/mkayander/es-guard#readme)
- 🐛 [Issues](https://github.com/mkayander/es-guard/issues)
- 💬 [Discussions](https://github.com/mkayander/es-guard/discussions)
