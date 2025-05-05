import { Command } from 'commander';
import chalk from 'chalk';
import { translateProject } from '../translator/translator.js';
import { loadNuxtConfig } from '../config/nuxtConfigLoader.js';
import { TranslationOptions } from '../types/options.js';

/**
 * Sets up the command-line interface for the translator
 */
export function setupCli(): void {
    const program = new Command();

    program
        .name('vue-i18n-translator')
        .description('Translate Vue i18n JSON files using OpenAI')
        .version('1.0.0')
        .option('-r, --root <path>', 'Root directory of the Nuxt project', process.cwd())
        .option('-s, --source <locale>', 'Source language code (overrides Nuxt default locale)')
        .option('-t, --target <locales>', 'Comma-separated list of target language codes (overrides Nuxt locales)')
        .option('-m, --model <model>', 'OpenAI model to use for translation', process.env.OPENAI_MODEL || 'gpt-3.5-turbo')
        .option('--mock', 'Use mock translations for testing (no API call)')
        .option('-f, --formality <level>', 'Formality level for translations (formal/informal)', process.env.FORMALITY_LEVEL)
        .action(async (options) => {
            try {
                console.log(chalk.blue('Vue i18n Translator'));
                console.log(chalk.dim('Initializing translation process...\n'));

                // Parse options
                const translationOptions: TranslationOptions = {
                    rootDir: options.root || process.env.ROOT_DIRECTORY || process.cwd(),
                    sourceLocale: options.source || process.env.DEFAULT_LOCALE,
                    targetLocales: options.target ? options.target.split(',') :
                        process.env.TARGET_LOCALES ? process.env.TARGET_LOCALES.split(',') : undefined,
                    model: options.model || process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                    mock: options.mock || false,
                    formality: options.formality || process.env.FORMALITY_LEVEL as 'formal' | 'informal' | undefined
                };

                // Load Nuxt configuration
                const nuxtConfig = await loadNuxtConfig(translationOptions.rootDir);

                // If sourceLocale is not specified, use the one from Nuxt config
                if (!translationOptions.sourceLocale && nuxtConfig.i18n?.defaultLocale) {
                    translationOptions.sourceLocale = nuxtConfig.i18n.defaultLocale;
                }

                // If targetLocales is not specified, use all locales from Nuxt config except the source
                if (!translationOptions.targetLocales && nuxtConfig.i18n?.locales) {
                    const allLocales = Array.isArray(nuxtConfig.i18n.locales)
                        ? nuxtConfig.i18n.locales.map((locale: any) =>
                            typeof locale === 'string' ? locale : locale.code)
                        : Object.keys(nuxtConfig.i18n.locales);

                    translationOptions.targetLocales = allLocales.filter(
                        (locale: string) => locale !== translationOptions.sourceLocale
                    );
                }

                // Always ensure the source locale is not in target locales
                if (translationOptions.targetLocales && translationOptions.sourceLocale) {
                    const sourceLocale = translationOptions.sourceLocale;

                    // Normalize and deduplicate target locales
                    const normalizedLocales = new Map<string, string>();

                    translationOptions.targetLocales.forEach(locale => {
                        const normalizedCode = normalizeLocaleCode(locale);
                        if (normalizedCode &&
                            normalizedCode !== sourceLocale &&
                            !isLocaleEquivalent(normalizedCode, sourceLocale)) {
                            // Use the normalized code as the key to deduplicate
                            normalizedLocales.set(normalizedCode, locale);
                        }
                    });

                    // Convert back to array
                    translationOptions.targetLocales = Array.from(normalizedLocales.keys());
                }

                // Validate options
                if (!translationOptions.sourceLocale) {
                    throw new Error('Source locale not found. Please specify it with --source option or in nuxt.config.ts');
                }

                if (!translationOptions.targetLocales || translationOptions.targetLocales.length === 0) {
                    throw new Error('No target locales found. Please specify them with --target option or in nuxt.config.ts');
                }

                // Display configuration
                console.log(chalk.green('Configuration:'));
                console.log(`Root directory: ${chalk.yellow(translationOptions.rootDir)}`);
                console.log(`Source locale: ${chalk.yellow(translationOptions.sourceLocale)}`);
                console.log(`Target locales: ${chalk.yellow(translationOptions.targetLocales.join(', '))}`);
                console.log(`OpenAI model: ${chalk.yellow(translationOptions.model)}`);
                if (translationOptions.formality) {
                    console.log(`Formality level: ${chalk.yellow(translationOptions.formality)}`);
                }
                if (translationOptions.mock) {
                    console.log(chalk.yellow(`MOCK MODE: No actual API calls will be made`));
                }
                console.log('');

                // Start translation process
                await translateProject(translationOptions);

                console.log(chalk.green('\nTranslation completed successfully!'));
            } catch (error) {
                console.error(chalk.red('Error:'), (error as Error).message);
                process.exit(1);
            }
        });

    program.parse();
}

/**
 * Normalizes a locale code by removing .json extension and converting to lowercase
 * @param locale The locale string to normalize
 * @returns Normalized locale code
 */
function normalizeLocaleCode(locale: string): string {
    // Remove .json extension if present
    if (locale.endsWith('.json')) {
        locale = locale.slice(0, -5);
    }

    // Map of common language names to ISO codes
    const languageMap: Record<string, string> = {
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
    };

    // Convert full language names to codes
    const lowerLocale = locale.toLowerCase();
    if (languageMap[lowerLocale]) {
        return languageMap[lowerLocale];
    }

    // If it's already a valid ISO code, return as is
    if (/^[a-z]{2,3}(-[a-z]{2,4})?$/i.test(locale)) {
        return locale.toLowerCase();
    }

    return locale.toLowerCase();
}

/**
 * Checks if two locale codes are equivalent (same language)
 * @param localeA First locale code
 * @param localeB Second locale code
 * @returns True if the locales represent the same language
 */
function isLocaleEquivalent(localeA: string, localeB: string): boolean {
    // Normalize both locales
    const normalizedA = normalizeLocaleCode(localeA);
    const normalizedB = normalizeLocaleCode(localeB);

    // Check if they're the same after normalization
    return normalizedA === normalizedB;
} 