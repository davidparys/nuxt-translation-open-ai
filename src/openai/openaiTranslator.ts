import { OpenAI } from 'openai';

// Initialize OpenAI client only when needed to avoid errors on startup
let openai: OpenAI | null = null;

// Maximum number of items to process in a single batch
const MAX_BATCH_SIZE = 50;

/**
 * Gets or creates an OpenAI client
 * @returns OpenAI client
 */
function getOpenAIClient(): OpenAI {
    if (!openai) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OpenAI API key not found. Please set the OPENAI_API_KEY environment variable.');
        }
        openai = new OpenAI({ apiKey });
    }
    return openai;
}

/**
 * Creates a mock translation for testing purposes
 * @param text Text to translate
 * @param targetLocale Target language code
 * @returns Mock translated text
 */
function createMockTranslation(text: string, targetLocale: string): string {
    // Simple mock translations for testing
    const prefixes: Record<string, string> = {
        'fr': '[FR] ',
        'de': '[DE] ',
        'es': '[ES] ',
        'it': '[IT] ',
        'ja': '[JA] ',
        'zh': '[ZH] ',
        'pl': '[PL] ',
    };

    const prefix = prefixes[targetLocale] || `[${targetLocale.toUpperCase()}] `;
    return prefix + text;
}

/**
 * Translates text content using OpenAI API
 * @param text Text to translate
 * @param sourceLocale Source language code
 * @param targetLocale Target language code
 * @param model OpenAI model to use
 * @param mock Use mock translations for testing
 * @param formality Formality level for translation
 * @returns Translated text
 */
export async function translateContent(
    text: string,
    sourceLocale: string,
    targetLocale: string,
    model: string,
    mock: boolean = false,
    formality?: 'formal' | 'informal'
): Promise<string> {
    // If mock mode is enabled, return a mock translation
    if (mock) {
        return createMockTranslation(text, targetLocale);
    }

    try {
        const client = getOpenAIClient();

        let formalityInstruction = '';
        if (formality) {
            formalityInstruction = `Use ${formality} language in your translation.`;
        }

        const prompt = `Translate the following text from ${sourceLocale} to ${targetLocale}. 
${formalityInstruction}
Output only the translation without any additional text or explanations:

${text}`;

        const response = await client.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: 'You are a professional translator. Translate the given text accurately while preserving the original meaning and formatting.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 1000,
        });

        const translation = response.choices[0]?.message?.content?.trim();

        if (!translation) {
            throw new Error('No translation returned from OpenAI');
        }

        return translation;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Translation failed: ${error.message}`);
        }
        throw new Error('Translation failed with unknown error');
    }
}

/**
 * Translates a batch of texts using OpenAI API
 * @param texts Array of texts to translate
 * @param sourceLocale Source language code
 * @param targetLocale Target language code
 * @param model OpenAI model to use
 * @param mock Use mock translations for testing
 * @param formality Formality level for translation
 * @returns Array of translated texts
 */
export async function translateBatch(
    texts: string[],
    sourceLocale: string,
    targetLocale: string,
    model: string,
    mock: boolean = false,
    formality?: 'formal' | 'informal'
): Promise<string[]> {
    if (texts.length === 0) {
        return [];
    }

    // If mock mode is enabled, return mock translations
    if (mock) {
        return texts.map(text => createMockTranslation(text, targetLocale));
    }

    if (texts.length === 1) {
        const translation = await translateContent(texts[0], sourceLocale, targetLocale, model, mock, formality);
        return [translation];
    }

    try {
        const client = getOpenAIClient();

        let formalityInstruction = '';
        if (formality) {
            formalityInstruction = `Use ${formality} language in your translation.`;
        }

        const prompt = `Translate the following texts from ${sourceLocale} to ${targetLocale}.
${formalityInstruction}
Each text is separated by "-----" and numbered. Provide translations in the same format:

${texts.map((text, index) => `${index + 1}. ${text}`).join('\n-----\n')}`;

        const response = await client.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: 'You are a professional translator. Translate the given texts accurately while preserving the original meaning and formatting. Return only the translations in the numbered format requested. If there are any {} braces in the text, DO NOT translate them keep them as is. ' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 2000,
        });

        const translationText = response.choices[0]?.message?.content?.trim();

        if (!translationText) {
            throw new Error('No translation returned from OpenAI');
        }

        // Parse the response to extract individual translations
        const translationBlocks = translationText.split('-----').map((block: string) => block.trim());

        // Extract the actual translation text by removing the numbering
        const translations = translationBlocks.map((block: string) => {
            const match = block.match(/^\d+\.\s+(.+)$/s);
            return match ? match[1].trim() : block.trim();
        });

        // Ensure we have the right number of translations
        if (translations.length !== texts.length) {
            throw new Error(`Expected ${texts.length} translations but got ${translations.length}`);
        }

        return translations;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Batch translation failed: ${error.message}`);
        }
        throw new Error('Batch translation failed with unknown error');
    }
}

/**
 * Translates a large batch of texts by splitting into smaller batches
 * @param entries Object with keys and texts to translate
 * @param sourceLocale Source language code
 * @param targetLocale Target language code
 * @param model OpenAI model to use
 * @param mock Use mock translations for testing
 * @param onProgress Callback for progress updates
 * @param formality Formality level for translation
 * @returns Object with keys and translated texts
 */
export async function translateEntries(
    entries: Record<string, string>,
    sourceLocale: string,
    targetLocale: string,
    model: string,
    mock: boolean = false,
    onProgress?: (completed: number, total: number, currentKey?: string) => void,
    formality?: 'formal' | 'informal'
): Promise<Record<string, string>> {
    const keys = Object.keys(entries);
    const total = keys.length;

    if (total === 0) {
        return {};
    }

    // If mock mode is enabled, return mock translations
    if (mock) {
        const result: Record<string, string> = {};
        for (const key of keys) {
            result[key] = createMockTranslation(entries[key], targetLocale);
            if (onProgress) {
                onProgress(Object.keys(result).length, total, key);
            }
        }
        return result;
    }

    // Process in batches to optimize API calls
    const result: Record<string, string> = {};

    // Process in chunks of MAX_BATCH_SIZE
    for (let i = 0; i < total; i += MAX_BATCH_SIZE) {
        const batchKeys = keys.slice(i, i + MAX_BATCH_SIZE);
        const batchTexts = batchKeys.map(key => entries[key]);

        // Call the first key as current for progress reporting
        if (onProgress) {
            onProgress(Object.keys(result).length, total, batchKeys[0]);
        }

        try {
            // Translate the batch
            const translations = await translateBatch(batchTexts, sourceLocale, targetLocale, model, mock, formality);

            // Associate translations with their keys
            for (let j = 0; j < batchKeys.length; j++) {
                result[batchKeys[j]] = translations[j];
            }

            // Report progress after batch completion
            if (onProgress) {
                onProgress(Object.keys(result).length, total);
            }
        } catch (error) {
            // If batch fails, fall back to individual translations
            for (const key of batchKeys) {
                if (!result[key]) {
                    try {
                        if (onProgress) {
                            onProgress(Object.keys(result).length, total, key);
                        }
                        result[key] = await translateContent(entries[key], sourceLocale, targetLocale, model, mock, formality);
                    } catch (innerError) {
                        // Skip this key on failure
                        console.error(`Failed to translate key: ${key}`, innerError);
                    }
                }
            }
        }
    }

    return result;
} 