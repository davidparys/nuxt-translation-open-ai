import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import chalk from 'chalk';
import { TranslationOptions, NuxtConfig } from '../types/options.js';
import { loadNuxtConfig } from '../config/nuxtConfigLoader.js';
import { translateContent, translateEntries } from '../openai/openaiTranslator.js';
import { flattenObject, unflattenObject } from '../utils/jsonUtils.js';

/**
 * Main function to translate a Nuxt i18n project
 * @param options Translation options
 */
export async function translateProject(options: TranslationOptions): Promise<void> {
    try {
        // Load Nuxt configuration
        const nuxtConfig = await loadNuxtConfig(options.rootDir);

        if (!nuxtConfig.i18n) {
            throw new Error('i18n configuration not found in Nuxt config');
        }

        // Get language directory from Nuxt config
        const langDir = nuxtConfig.i18n.langDir || 'locales';
        const fullLangDir = path.resolve(options.rootDir, langDir);

        if (!fs.existsSync(fullLangDir)) {
            throw new Error(`Language directory not found at ${fullLangDir}`);
        }

        // Get source language file
        const sourceLocale = options.sourceLocale;
        if (!sourceLocale) {
            throw new Error('Source locale not specified');
        }

        // Determine source file path based on lazy loading configuration
        let sourceFilePath: string;

        if (nuxtConfig.i18n.lazy) {
            // In lazy loading mode, each locale has its own file
            sourceFilePath = findLocaleFile(fullLangDir, sourceLocale, nuxtConfig.i18n);
        } else {
            // In non-lazy mode, all locales are in a single file named by locale code
            sourceFilePath = path.resolve(fullLangDir, `${sourceLocale}.json`);
        }

        if (!fs.existsSync(sourceFilePath)) {
            throw new Error(`Source language file not found at ${sourceFilePath}`);
        }

        // Read source file
        const sourceContent = await fs.readJson(sourceFilePath);

        // Flatten source content for easier processing
        const flattenedSource = flattenObject(sourceContent);
        const totalKeys = Object.keys(flattenedSource).length;

        console.log(chalk.blue(`Found ${totalKeys} keys in source language file`));

        // Process each target language
        const targetLocales = options.targetLocales || [];

        // Ensure the source locale is not in the target locales
        const filteredTargetLocales = targetLocales.filter(locale =>
            locale !== sourceLocale &&
            locale !== sourceLocale + '.json' &&
            !locale.includes(`${sourceLocale}.`) &&
            !locale.toLowerCase().includes(`${sourceLocale.toLowerCase()}`)
        );

        if (filteredTargetLocales.length === 0) {
            console.log(chalk.yellow('No valid target locales found after filtering out the source locale.'));
            return;
        }

        for (const targetLocale of filteredTargetLocales) {
            // Extract just the locale code from potential longer locale strings
            // This ensures we always use codes like 'pl' instead of 'Polish'
            const localeCode = extractLocaleCode(targetLocale);
            const spinner = ora(`Translating to ${targetLocale} (${localeCode})...`).start();

            // Determine target file path
            let targetFilePath: string;

            if (nuxtConfig.i18n.lazy) {
                targetFilePath = findLocaleFile(fullLangDir, localeCode, nuxtConfig.i18n);
                // If file doesn't exist, create it based on source locale file naming pattern
                if (!fs.existsSync(targetFilePath)) {
                    const sourceFileName = path.basename(sourceFilePath);
                    const targetFileName = sourceFileName.replace(sourceLocale, localeCode);
                    targetFilePath = path.resolve(fullLangDir, targetFileName);
                }
            } else {
                // Always use the exact locale code for the file name
                targetFilePath = path.resolve(fullLangDir, `${localeCode}.json`);
            }

            // Read target file if it exists
            let existingTranslations: Record<string, string> = {};

            if (fs.existsSync(targetFilePath)) {
                try {
                    const targetContent = await fs.readJson(targetFilePath);
                    existingTranslations = flattenObject(targetContent);
                    spinner.text = `Found existing translations for ${localeCode}, identifying missing keys...`;
                } catch (error) {
                    spinner.warn(`Error reading existing ${localeCode} translations, starting fresh`);
                }
            }

            // Identify keys that need translation - ensure we don't translate keys that already exist
            const keysToTranslate = Object.keys(flattenedSource).filter(
                key => !existingTranslations[key] || existingTranslations[key] === ''
            );

            if (keysToTranslate.length === 0) {
                spinner.succeed(`All ${totalKeys} keys already translated for ${localeCode}`);
                continue;
            }

            spinner.text = `Translating ${keysToTranslate.length} missing keys to ${localeCode}...`;

            // Handle interruption signal
            let interrupted = false;
            const handleInterruption = () => {
                interrupted = true;
                spinner.text = 'Interruption received, saving current progress...';
            };

            process.on('SIGINT', handleInterruption);

            // Create a subset of source with only keys that need translation
            const pendingTranslations: Record<string, string> = {};
            for (const key of keysToTranslate) {
                pendingTranslations[key] = flattenedSource[key];
            }

            // Translate all pending keys in batches
            try {
                // Create a progress callback for the spinner
                const onProgress = (completed: number, total: number, currentKey?: string) => {
                    if (interrupted) return;
                    if (currentKey) {
                        spinner.text = `Translating to ${localeCode} [${completed}/${total}]: ${currentKey}`;
                    } else {
                        spinner.text = `Translated ${completed}/${total} keys to ${localeCode}...`;
                    }
                };

                // Translate all pending keys in batches
                const newTranslations = await translateEntries(
                    pendingTranslations,
                    sourceLocale,
                    localeCode,
                    options.model,
                    options.mock,
                    onProgress,
                    options.formality
                );

                // Merge with existing translations
                const translatedEntries: Record<string, string> = {
                    ...existingTranslations,
                    ...newTranslations
                };

                // Unflatten the translated entries
                const finalTranslations = unflattenObject(translatedEntries);

                // Save to file
                await fs.ensureDir(path.dirname(targetFilePath));
                await fs.writeJson(targetFilePath, finalTranslations, { spaces: 2 });

                if (interrupted) {
                    spinner.succeed(`Translation interrupted, saved progress (${Object.keys(newTranslations).length}/${keysToTranslate.length} keys) to ${targetFilePath}`);
                    process.exit(0);
                } else {
                    spinner.succeed(`Translated ${Object.keys(newTranslations).length} keys to ${localeCode} and saved to ${targetFilePath}`);
                }
            } catch (error) {
                spinner.fail(`Error during batch translation: ${(error as Error).message}`);

                // Fallback to individual translations if batch fails
                spinner.text = `Falling back to individual translations...`;

                // Translate missing keys one by one
                const translatedEntries: Record<string, string> = { ...existingTranslations };
                let completedCount = 0;

                for (const key of keysToTranslate) {
                    if (interrupted) break;
                    if (translatedEntries[key] && translatedEntries[key] !== '') continue; // Skip if already translated

                    try {
                        // Update spinner text with current key
                        spinner.text = `Translating to ${localeCode} [${completedCount + 1}/${keysToTranslate.length}]: ${key}`;

                        // Translate the content
                        const value = flattenedSource[key];
                        const translatedValue = await translateContent(
                            value,
                            sourceLocale,
                            localeCode,
                            options.model,
                            options.mock,
                            options.formality
                        );

                        translatedEntries[key] = translatedValue;
                        completedCount++;
                    } catch (error) {
                        spinner.text = `Error translating key ${key}: ${(error as Error).message}`;
                        // Continue with next key
                    }
                }

                // Unflatten the translated entries
                const finalTranslations = unflattenObject(translatedEntries);

                // Save to file
                await fs.ensureDir(path.dirname(targetFilePath));
                await fs.writeJson(targetFilePath, finalTranslations, { spaces: 2 });

                if (interrupted) {
                    spinner.succeed(`Translation interrupted, saved progress (${completedCount}/${keysToTranslate.length} keys) to ${targetFilePath}`);
                    process.exit(0);
                } else {
                    spinner.succeed(`Translated ${completedCount} keys to ${localeCode} and saved to ${targetFilePath}`);
                }
            }

            // Remove event listener
            process.removeListener('SIGINT', handleInterruption);
        }
    } catch (error) {
        throw new Error(`Translation failed: ${(error as Error).message}`);
    }
}

/**
 * Extracts the locale code from a locale string
 * @param locale Locale string which might be 'pl', 'pl.json', 'Polish', etc.
 * @returns The actual locale code (e.g., 'pl')
 */
function extractLocaleCode(locale: string): string {
    // If it's a filename with .json extension, remove it
    if (locale.endsWith('.json')) {
        locale = locale.slice(0, -5);
    }

    // Common locale code patterns
    const commonLocales: Record<string, string> = {
        'english': 'en',
        'polish': 'pl',
        'spanish': 'es',
        'french': 'fr',
        'german': 'de',
        'italian': 'it',
        'japanese': 'ja',
        'chinese': 'zh',
        'russian': 'ru',
        'portuguese': 'pt',
        'dutch': 'nl',
        'korean': 'ko',
        'arabic': 'ar',
        'turkish': 'tr'
        // Add more mappings as needed
    };

    // Check if it's a full language name and convert to code
    const lowerLocale = locale.toLowerCase();
    if (commonLocales[lowerLocale]) {
        return commonLocales[lowerLocale];
    }

    // If it's already a valid ISO code (typically 2-3 characters), return as is
    if (/^[a-z]{2,3}(-[a-z]{2,4})?$/i.test(locale)) {
        return locale.toLowerCase();
    }

    // If nothing else matches, just return the original but ensure it's lowercase
    // This will help maintain consistent file naming
    return locale.toLowerCase();
}

/**
 * Finds the file path for a specific locale
 * @param langDir Language directory
 * @param locale Locale code
 * @param i18nConfig i18n configuration
 * @returns Path to the locale file
 */
function findLocaleFile(langDir: string, locale: string, i18nConfig: NuxtConfig['i18n']): string {
    if (!i18nConfig || !i18nConfig.locales) {
        return path.resolve(langDir, `${locale}.json`);
    }

    // Handle different formats of locales configuration
    if (Array.isArray(i18nConfig.locales)) {
        // Find the locale object in the array
        const localeObj = i18nConfig.locales.find(item => {
            if (typeof item === 'string') {
                return item === locale;
            }
            return item.code === locale;
        });

        if (typeof localeObj === 'object' && localeObj.file) {
            return path.resolve(langDir, localeObj.file);
        }
    } else if (typeof i18nConfig.locales === 'object' && !Array.isArray(i18nConfig.locales)) {
        // Handle object format
        const localeObj = i18nConfig.locales[locale];
        if (localeObj && localeObj.file) {
            return path.resolve(langDir, localeObj.file);
        }
    }

    // Default to locale code as filename
    return path.resolve(langDir, `${locale}.json`);
} 