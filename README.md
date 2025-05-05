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

## Installation

### As a global CLI tool

```bash
npm install -g vue-i18n-translator
```

### For use in a project

```bash
npm install --save-dev vue-i18n-translator
```

## Usage

### CLI Usage

```bash
# Using npx (no installation required)
npx vue-i18n-translator

# Or if installed globally
vue-i18n-translator

# Basic usage (auto-detects from nuxt.config.ts in current directory)
vue-i18n-translator

# Specify root directory
vue-i18n-translator --root ./my-nuxt-project

# Specify source language
vue-i18n-translator --source en

# Specify target languages
vue-i18n-translator --target fr,es,de

# Specify OpenAI model
vue-i18n-translator --model gpt-4

# Specify formality level (useful for languages like Polish, German, etc.)
vue-i18n-translator --formality formal
```

### GitHub Action Usage

Create a workflow file in your repository (e.g., `.github/workflows/translate.yml`):

```yaml
name: Translate i18n files

on:
  push:
    branches: [ main ]
    paths:
      - '**/locales/**/*.json'

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Translate i18n files
        uses: yourusername/vue-i18n-translator@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          source-locale: en
          target-locales: fr,es,de
          openai-model: gpt-3.5-turbo
          
      - name: Commit and push changes
        uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "Update translations"
```

## Configuration

You can configure the tool using command-line options, environment variables, or GitHub Action inputs:

| CLI Option | Env Variable | Action Input | Description |
|--------|-------------|--------------|-------------|
| `--root` | `ROOT_DIRECTORY` | `root-directory` | Root directory of the Nuxt project |
| `--source` | `DEFAULT_LOCALE` | `source-locale` | Source language code |
| `--target` | `TARGET_LOCALES` | `target-locales` | Comma-separated list of target language codes |
| `--model` | `OPENAI_MODEL` | `openai-model` | OpenAI model to use for translation |
| `--formality` | `FORMALITY_LEVEL` | `formality-level` | Formality level for translations (formal/informal) |

## Environment Variables

Create a `.env` file in your project root:

```
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
DEFAULT_LOCALE=en
TARGET_LOCALES=fr,es,de
ROOT_DIRECTORY=./my-nuxt-project
FORMALITY_LEVEL=formal
```

## License

MIT 