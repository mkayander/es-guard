# ES-Guard

A TypeScript-based tool to check JavaScript compatibility with target environments using ESLint.

## Features

- 🔍 **ES Version Compatibility**: Check if your JavaScript code is compatible with specific ES versions (ES2015, ES2016, ES2017, etc.)
- 🌐 **Browser Compatibility**: Verify browser support using eslint-plugin-compat
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
# Basic usage with defaults
es-guard

# Check specific directory
es-guard build

# Specify target ES version
es-guard -t 2020 build

# Specify browser targets
es-guard --browsers "> 0.5%, last 2 versions, Firefox ESR, not dead" dist

# Show help
es-guard --help

# Show version
es-guard --version
```

### Programmatic Usage

```typescript
import { checkCompatibility } from 'es-guard';

const violations = await checkCompatibility({
  dir: 'dist',
  target: '2015',
  browsers: '> 1%, last 2 versions, not dead, ie 11',
});

if (violations.length > 0) {
  console.log('Compatibility issues found:', violations);
}
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
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npx es-guard -t 2015 dist
```

## Configuration

### Parameters

| Parameter  | Description                                | Default                                  |
| ---------- | ------------------------------------------ | ---------------------------------------- |
| `path`     | Directory to scan for JavaScript files     | `dist`                                   |
| `target`   | Target ES version (2015, 2016, 2017, etc.) | `2015`                                   |
| `browsers` | Browser targets for compatibility checking | `> 1%, last 2 versions, not dead, ie 11` |

### Browser Targets

The `browsers` parameter uses the same format as Browserslist. Examples:

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
