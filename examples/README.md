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
```

### Source Map Examples

```bash
# Build the project first to generate source maps
pnpm run build

# Run source map demo
node examples/source-map-demo.js
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

# Run compatibility check
npx es-guard dist
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
