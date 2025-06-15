# Vue i18n Translator

A command-line tool and GitHub Action that integrates with Nuxt projects to automate translations using OpenAI's API.

Automatically translates your json files with i18n configuration from your Nuxt project.

## Features

- Automatically detects i18n configuration from your Nuxt project
- Translates JSON content preserving nested structure
- Maintains original keys (no translation of keys)
- Supports selection of different OpenAI models
- Supports formal/informal language options for translations
- Displays translation progress in real-time
- Handles interruptions gracefully with partial saving
- Skips existing translations in target files
- Can be used as a CLI tool or GitHub Action
-Multiple Files Per Locale Supports both single file and multiple files per locale configurations


## Installation

```bash
npm install -g vue-i18n-translator
```

## Usage

### Basic Usage

```bash
vue-i18n-translator --root /path/to/nuxt/project --source en --target es,fr,de
```

### With OpenAI API Key

```bash
OPENAI_API_KEY=your_api_key vue-i18n-translator --root /path/to/nuxt/project --source en --target es
```

### Mock Mode (for testing)

```bash
vue-i18n-translator --root /path/to/nuxt/project --source en --target es --mock
```

## Configuration Support

### Single File Per Locale

The tool supports the traditional single file per locale configuration:

```typescript
// nuxt.config.ts
export default {
  i18n: {
    defaultLocale: 'en',
    langDir: 'locales',
    locales: [
      {
        code: 'en',
        file: 'en.json',
        name: 'English'
      },
      {
        code: 'es',
        file: 'es.json',
        name: 'Español'
      }
    ]
  }
}
```

### Multiple Files Per Locale

**NEW**: The tool now supports multiple files per locale using the `files` array:

```typescript
// nuxt.config.ts
export default {
  i18n: {
    defaultLocale: 'en',
    langDir: 'locales',
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        name: 'English',
        files: ['en/common.json', 'en/home.json', 'en/about.json']
      },
      {
        code: 'es',
        iso: 'es-ES',
        name: 'Español',
        files: ['es/common.json', 'es/home.json', 'es/about.json']
      }
    ]
  }
}
```

This configuration allows you to organize your translations into multiple files per locale, which is especially useful for large projects where you want to separate translations by page or feature.

### Directory Structure Example

For the multiple files configuration above, your directory structure would look like:

```
locales/
├── en/
│   ├── common.json
│   ├── home.json
│   └── about.json
└── es/
    ├── common.json
    ├── home.json
    └── about.json
```

## Command Line Options

- `--root, -r`: Root directory of the Nuxt project (required)
- `--source, -s`: Source locale code (e.g., 'en')
- `--target, -t`: Target locale codes, comma-separated (e.g., 'es,fr,de')
- `--model, -m`: OpenAI model to use (default: 'gpt-4.1-nano')
- `--mock`: Use mock translations for testing (no API calls)
- `--formality`: Translation formality level ('formal' or 'informal')

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required unless using --mock)

## How It Works

1. **Configuration Parsing**: Reads your `nuxt.config.ts` to extract i18n settings
2. **Source File Detection**: Locates source language files (single or multiple per locale)
3. **Content Merging**: For multiple files, merges content while preserving structure
4. **Translation Processing**: Translates missing keys using OpenAI API
5. **File Distribution**: Saves translations back to appropriate files maintaining the original structure
6. **Incremental Updates**: Preserves existing translations and only translates new content

## Examples

### Single File Example

```bash
# Translate from English to Spanish and French
vue-i18n-translator --root ./my-nuxt-app --source en --target es,fr
```

### Multiple Files Example

```bash
# Translate a project with multiple files per locale
vue-i18n-translator --root ./my-large-app --source en --target es,fr,de --mock
```

### With Custom Model

```bash
# Use a specific OpenAI model
vue-i18n-translator --root ./my-app --source en --target es --model gpt-4
```

## Requirements

- Node.js 18+
- Nuxt.js project with @nuxtjs/i18n
- OpenAI API key (unless using mock mode)

## License

MIT 