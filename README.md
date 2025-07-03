# ES-Guard

[![codecov](https://codecov.io/gh/mkayander/es-guard/branch/main/graph/badge.svg)](https://codecov.io/gh/mkayander/es-guard)

A TypeScript-based tool to check JavaScript compatibility with target environments using ESLint.

## Features

- 🔍 **ES Version Compatibility**: Check if your JavaScript code is compatible with specific ES versions (ES2015, ES2016, ES2017, etc.)
- 🌐 **Browser Compatibility**: Verify browser support using eslint-plugin-compat
- 🎯 **Auto Browser Detection**: Automatically determine browser targets from ES version (optional)
- 📁 **Directory Scanning**: Automatically scan directories for JavaScript files
- 🎯 **GitHub Actions Ready**: Works seamlessly with GitHub Actions
- 📦 **NPM Package**: Install globally or use as a dependency

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
git clone https://github.com/yourusername/es-guard.git
cd es-guard
npm install
npm run build
```

## Usage

### Command Line

```bash
# Basic usage with defaults (auto-determined browsers)
es-guard

# Check specific directory
es-guard build

# Specify target ES version (year format)
es-guard -t 2020 build

# Specify target ES version (numeric format)
es-guard -t 11 build

# Use latest ES version
es-guard -t latest build

# Specify custom browser targets
es-guard --browsers "> 0.5%, last 2 versions, Firefox ESR, not dead" dist

# Show help
es-guard --help

# Show version
es-guard --version
```

### Programmatic Usage

```typescript
import { checkCompatibility } from "es-guard";

// With auto-determined browsers
const violations = await checkCompatibility({
  dir: "dist",
  target: "2015",
});

// With custom browsers
const violations = await checkCompatibility({
  dir: "dist",
  target: "2015",
  browsers: "> 1%, last 2 versions, not dead, ie 11",
});
```

### GitHub Actions

```yaml
name: Check Compatibility
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

| Parameter  | Description                                | Default                     | Required |
| ---------- | ------------------------------------------ | --------------------------- | -------- |
| `path`     | Directory to scan for JavaScript files     | `dist`                      | No       |
| `target`   | Target ES version                          | `2015`                      | Yes      |
| `browsers` | Browser targets for compatibility checking | Auto-determined from target | No       |

### ES Target Versions

The `target` parameter accepts multiple formats:

- **Year format**: `2015`, `2016`, `2017`, etc.
- **Numeric format**: `6` (ES2015), `7` (ES2016), `11` (ES2020), etc.
- **Latest**: `latest` for the most recent ES version

### Browser Targets

The `browsers` parameter uses the same format as Browserslist. If not specified, browsers will be automatically determined based on the ES target:

- **ES2015/ES6**: `> 1%, last 2 versions, not dead, ie 11`
- **ES2016-2017/ES7-8**: `> 1%, last 2 versions, not dead, not ie 11`
- **ES2018-2019/ES9-10**: `> 1%, last 2 versions, not dead, not ie 11, not op_mini all`
- **ES2020+/ES11+**: `> 1%, last 2 versions, not dead, not ie 11, not op_mini all, not android < 67`

Custom browser targets examples:

- `> 1%, last 2 versions, not dead, ie 11` - Modern browsers + IE11
- `> 0.5%, last 2 versions, Firefox ESR, not dead` - Broader support
- `defaults` - Default Browserslist targets
- `last 1 version` - Latest version of each browser

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
npm run test:run
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
3. Make your changes
4. Add tests if applicable
5. Run the linter: `npm run lint`
6. Submit a pull request

## Support

- 📖 [Documentation](https://github.com/yourusername/es-guard#readme)
- 🐛 [Issues](https://github.com/yourusername/es-guard/issues)
- 💬 [Discussions](https://github.com/yourusername/es-guard/discussions)
