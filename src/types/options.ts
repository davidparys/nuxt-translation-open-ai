/**
 * Options for configuring the translation process
 */
export interface TranslationOptions {
    /**
     * Root directory of the Nuxt project
     */
    rootDir: string;

    /**
     * Source locale code (e.g., 'en')
     */
    sourceLocale?: string;

    /**
     * Target locale codes for translation
     */
    targetLocales?: string[];

    /**
     * OpenAI model to use for translation
     */
    model: string;

    /**
     * Use mock translations for testing (no API call)
     */
    mock?: boolean;

    /**
     * Formality level for translations (e.g., 'formal', 'informal')
     * This is especially useful for languages with formal distinctions like Polish
     */
    formality?: 'formal' | 'informal';
}

/**
 * Structure of the Nuxt i18n configuration
 */
export interface NuxtI18nConfig {
    defaultLocale?: string;
    locales?: string[] | Record<string, any> | Array<{
        code: string;
        file?: string;
        files?: string[];
        [key: string]: any;
    }>;
    langDir?: string;
    lazy?: boolean;
    [key: string]: any;
}

/**
 * Structure of the Nuxt configuration
 */
export interface NuxtConfig {
    i18n?: NuxtI18nConfig;
    [key: string]: any;
} 