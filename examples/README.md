# ES-Guard Examples

This directory contains examples demonstrating how to use ES-Guard programmatically.

## Examples Overview

### `programmatic-usage.js`

JavaScript example showing basic programmatic usage of ES-Guard.

**Key features demonstrated:**

- Basic compatibility checking
- Auto-detection of project configuration
- Configuration validation
- Utility functions
- Verbose mode
- Custom configuration
- Error handling

### `programmatic-usage.ts`

TypeScript example with full type safety and advanced usage patterns.

**Additional features demonstrated:**

- Type-safe configuration
- Advanced result processing
- Source map handling
- Error categorization by severity

### `demo-without-sourcemap.js`

Simple demo file with modern JavaScript features that would trigger compatibility warnings.

### `source-map-demo.js`

Demo file showing source map functionality.

## Running the Examples

### JavaScript Example

```bash
node examples/programmatic-usage.js
```

### TypeScript Example

```bash
# First, compile TypeScript
npx tsc examples/programmatic-usage.ts --target ES2020 --module NodeNext --outDir examples/dist

# Then run
node examples/dist/programmatic-usage.js
```

## Integration Examples

### In a Build Script

```javascript
import { checkCompatibility, detectProjectConfig } from "es-guard";

async function validateBuild() {
  const config = detectProjectConfig(process.cwd());

  if (config.target && config.outputDir) {
    const result = await checkCompatibility({
      dir: config.outputDir,
      target: config.target,
    });

    if (result.errors.length > 0) {
      console.error("Build validation failed!");
      process.exit(1);
    }
  }
}

validateBuild();
```

### In a CI/CD Pipeline

```javascript
import { checkCompatibility } from "es-guard";

async function ciValidation() {
  const result = await checkCompatibility({
    dir: "dist",
    target: "2015",
    browsers: "> 1%, last 2 versions, not dead, ie 11",
  });

  if (result.errors.length > 0) {
    console.error("Compatibility check failed!");
    result.errors.forEach((violation) => {
      console.error(`File: ${violation.file}`);
      violation.messages.forEach((msg) => {
        console.error(`  Line ${msg.line}: ${msg.message}`);
      });
    });
    process.exit(1);
  }

  console.log("✅ All compatibility checks passed!");
}

ciValidation();
```

### In a Webpack Plugin

```javascript
import { checkCompatibility } from "es-guard";

class ESGuardPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync("ESGuardPlugin", async (compilation, callback) => {
      try {
        const result = await checkCompatibility({
          dir: this.options.outputDir || "dist",
          target: this.options.target || "2020",
        });

        if (result.errors.length > 0) {
          compilation.errors.push(new Error(`ES-Guard found ${result.errors.length} compatibility issues`));
        }

        callback();
      } catch (error) {
        callback(error);
      }
    });
  }
}

module.exports = ESGuardPlugin;
```

## Best Practices

1. **Always validate configuration** before running checks
2. **Use auto-detection** when possible to reduce configuration overhead
3. **Handle errors gracefully** and provide meaningful error messages
4. **Consider source maps** for better debugging experience
5. **Use appropriate browser targets** for your project requirements
6. **Enable verbose mode** during development for detailed output

## API Reference

For complete API documentation, see the main [README.md](../README.md) file or the TypeScript definitions in the package.
