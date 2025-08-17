# ES-Guard Examples

This directory contains practical examples demonstrating how to use ES-Guard in various scenarios.

## Examples Overview

### 1. **programmatic-usage.ts** - TypeScript Programmatic API

Comprehensive examples showing how to use ES-Guard programmatically in TypeScript projects.

**Features demonstrated:**

- Basic compatibility checking
- Auto-detection of project configuration
- Configuration validation
- Error handling and result processing
- Verbose mode usage
- Advanced result processing with source maps

**Best for:** TypeScript developers integrating ES-Guard into build tools, CI/CD pipelines, or custom scripts.

### 2. **programmatic-usage.js** - JavaScript Programmatic API

JavaScript version of the programmatic usage examples.

**Features demonstrated:**

- Same functionality as TypeScript version
- JavaScript-specific syntax and patterns
- CommonJS and ES module compatibility

**Best for:** JavaScript developers who prefer JS over TS.

### 3. **temp-folder-demo.js** - Temp Folder & Remote Project Support 🆕

Demonstrates how to use ES-Guard from any directory while detecting configuration from different project roots.

**Features demonstrated:**

- Running from temp folders or different working directories
- CI/CD pipeline simulation
- Multi-project validation from single location
- Cross-platform path handling
- Configuration detection from remote project directories

**Best for:**

- CI/CD pipeline developers
- Build script authors
- Multi-project monorepo maintainers
- Developers working with Docker containers or remote build servers

### 4. **source-map-demo.js** - Source Map Integration

Shows how ES-Guard handles source maps for accurate error reporting.

**Features demonstrated:**

- Source map parsing and resolution
- Original source file location reporting
- Multi-layer source map support
- Webpack and other bundler source map handling

**Best for:** Developers using bundlers like Webpack, Vite, or Rollup who want accurate error reporting.

### 5. **demo-without-sourcemap.js** - Basic Usage

Simple example without source map complexity.

**Features demonstrated:**

- Basic compatibility checking
- Simple error reporting
- Minimal configuration

**Best for:** Getting started with ES-Guard or simple use cases.

## Temp Folder Support Features

ES-Guard now supports running from any directory while maintaining full configuration detection capabilities:

### CLI Usage

```bash
# Run from any directory using --projectDir to specify project root
es-guard -p /path/to/project
es-guard --projectDir /path/to/project
es-guard -p /path/to/project build

# Use verbose mode to see project directory information
es-guard -p /path/to/project --verbose
```

### Programmatic Usage

```javascript
import { detectProjectConfig, checkCompatibility } from "es-guard";

// Detect config from project root (can be different from current working directory)
const config = detectProjectConfig("/path/to/actual/project");

if (config.target && config.outputDir) {
  // Resolve paths relative to project root
  const outputDir = path.isAbsolute(config.outputDir)
    ? config.outputDir
    : path.join("/path/to/actual/project", config.outputDir);

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

## Running the Examples

### Prerequisites

- Node.js 18+ installed
- ES-Guard installed (`pnpm install` in project root)

### TypeScript Examples

```bash
# Run TypeScript examples
pnpm run build
node dist/examples/programmatic-usage.js
```

### JavaScript Examples

```bash
# Run JavaScript examples directly
node examples/programmatic-usage.js
node examples/temp-folder-demo.js
```

### Source Map Examples

```bash
# Build the project first to generate source maps
pnpm run build

# Run source map demo
node examples/source-map-demo.js
```

## Example Output

### Temp Folder Demo Output

```
🚀 ES-Guard Temp Folder Demo

=== Example 1: Different Working Directory ===
Current working directory: /path/to/project
Project root: /path/to/project
Temp working directory: /path/to/project/temp-demo

🔍 Detecting configuration from project root...
Detected configuration:
  Target: 2020
  Output directory: ./dist
  Browserslist: > 1%, last 2 versions, not dead

📁 Checking output directory: /path/to/project/dist

✅ Compatibility check completed:
  Errors: 0
  Warnings: 2

=== Example 2: CI/CD Pipeline Simulation ===
CI environment - Project root: /path/to/project
CI environment - Build directory: dist

🔍 Detecting configuration for CI...
CI scanning directory: /path/to/project/dist
✅ CI configuration detected successfully
  Target: 2020
  Scan directory: /path/to/project/dist

=== Example 3: Multi-Project Validation ===
--- Checking frontend ---
✅ frontend: Target 2020, Build: /path/to/project/dist

--- Checking backend ---
⚠️  backend: Could not detect target

--- Checking shared ---
⚠️  shared: Could not detect target

🎉 Temp Folder Demo Completed!

Key Benefits:
  • Run from any directory (temp folders, CI containers, etc.)
  • Detect configuration from different project roots
  • Support for CI/CD pipelines and build containers
  • Multi-project validation from single location
  • Cross-platform path handling
```

## Integration Examples

### GitHub Actions

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
      - run: npx es-guard -p ${{ github.workspace }} dist
```

### Docker Container

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Run compatibility check from container
CMD ["npx", "es-guard", "-p", "/app", "dist"]
```

### Build Script

```bash
#!/bin/bash
# build-and-check.sh

# Build the project
npm run build

# Run compatibility check from temp directory
cd /tmp
npx es-guard -p /path/to/project dist

# Return to original directory
cd /path/to/project
```

## Getting Help

- **Documentation**: See the main [README.md](../README.md) for comprehensive usage information
- **CLI Help**: Run `es-guard --help` for command-line options
- **Issues**: Report bugs or request features on GitHub
- **Examples**: Check this directory for more specific use cases

## Contributing Examples

If you have a useful example that demonstrates ES-Guard capabilities, feel free to contribute:

1. Create a new example file in this directory
2. Follow the naming convention: `descriptive-name.js` or `descriptive-name.ts`
3. Include clear comments and documentation
4. Test your example to ensure it works correctly
5. Submit a pull request with your example

Your examples help other developers understand how to use ES-Guard effectively!
