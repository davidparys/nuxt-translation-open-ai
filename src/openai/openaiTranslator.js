"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateContent = translateContent;
exports.translateBatch = translateBatch;
exports.translateEntries = translateEntries;
var openai_1 = require("openai");
// Initialize OpenAI client only when needed to avoid errors on startup
var openai = null;
// Maximum number of items to process in a single batch
var MAX_BATCH_SIZE = 50;
/**
 * Gets or creates an OpenAI client
 * @returns OpenAI client
 */
function getOpenAIClient() {
    if (!openai) {
        var apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OpenAI API key not found. Please set the OPENAI_API_KEY environment variable.');
        }
        openai = new openai_1.OpenAI({ apiKey: apiKey });
    }
    return openai;
}
/**
 * Creates a mock translation for testing purposes
 * @param text Text to translate
 * @param targetLocale Target language code
 * @returns Mock translated text
 */
function createMockTranslation(text, targetLocale) {
    // Simple mock translations for testing
    var prefixes = {
        'fr': '[FR] ',
        'de': '[DE] ',
        'es': '[ES] ',
        'it': '[IT] ',
        'ja': '[JA] ',
        'zh': '[ZH] ',
        'pl': '[PL] ',
    };
    var prefix = prefixes[targetLocale] || "[".concat(targetLocale.toUpperCase(), "] ");
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
function translateContent(text_1, sourceLocale_1, targetLocale_1, model_1) {
    return __awaiter(this, arguments, void 0, function (text, sourceLocale, targetLocale, model, mock, formality) {
        var client, formalityInstruction, prompt_1, response, translation, error_1;
        var _a, _b, _c;
        if (mock === void 0) { mock = false; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    // If mock mode is enabled, return a mock translation
                    if (mock) {
                        return [2 /*return*/, createMockTranslation(text, targetLocale)];
                    }
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    client = getOpenAIClient();
                    formalityInstruction = '';
                    if (formality) {
                        formalityInstruction = "Use ".concat(formality, " language in your translation.");
                    }
                    prompt_1 = "Translate the following text from ".concat(sourceLocale, " to ").concat(targetLocale, ". \n").concat(formalityInstruction, "\nOutput only the translation without any additional text or explanations:\nAny text found in between curly braces {} should not be translated. Keep them as is.\n").concat(text);
                    return [4 /*yield*/, client.chat.completions.create({
                            model: model,
                            messages: [
                                { role: 'system', content: 'You are a professional translator. Translate the given text accurately while preserving the original meaning and formatting.' },
                                { role: 'user', content: prompt_1 }
                            ],
                            temperature: 0.3,
                            max_tokens: 1000,
                        })];
                case 2:
                    response = _d.sent();
                    translation = (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
                    if (!translation) {
                        throw new Error('No translation returned from OpenAI');
                    }
                    return [2 /*return*/, translation];
                case 3:
                    error_1 = _d.sent();
                    if (error_1 instanceof Error) {
                        throw new Error("Translation failed: ".concat(error_1.message));
                    }
                    throw new Error('Translation failed with unknown error');
                case 4: return [2 /*return*/];
            }
        });
    });
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
function translateBatch(texts_1, sourceLocale_1, targetLocale_1, model_1) {
    return __awaiter(this, arguments, void 0, function (texts, sourceLocale, targetLocale, model, mock, formality) {
        var translation, client, formalityInstruction, prompt_2, response, translationText, translationBlocks, translations, error_2;
        var _a, _b, _c;
        if (mock === void 0) { mock = false; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (texts.length === 0) {
                        return [2 /*return*/, []];
                    }
                    // If mock mode is enabled, return mock translations
                    if (mock) {
                        return [2 /*return*/, texts.map(function (text) { return createMockTranslation(text, targetLocale); })];
                    }
                    if (!(texts.length === 1)) return [3 /*break*/, 2];
                    return [4 /*yield*/, translateContent(texts[0], sourceLocale, targetLocale, model, mock, formality)];
                case 1:
                    translation = _d.sent();
                    return [2 /*return*/, [translation]];
                case 2:
                    _d.trys.push([2, 4, , 5]);
                    client = getOpenAIClient();
                    formalityInstruction = '';
                    if (formality) {
                        formalityInstruction = "Use ".concat(formality, " language in your translation.");
                    }
                    prompt_2 = "Translate the following texts from ".concat(sourceLocale, " to ").concat(targetLocale, ".\n").concat(formalityInstruction, "\nEach text is separated by \"-----\" and numbered. Provide translations in the same format:\n\n").concat(texts.map(function (text, index) { return "".concat(index + 1, ". ").concat(text); }).join('\n-----\n'));
                    return [4 /*yield*/, client.chat.completions.create({
                            model: model,
                            messages: [
                                { role: 'system', content: 'You are a professional translator. Translate the given texts accurately while preserving the original meaning and formatting. Return only the translations in the numbered format requested. If there are any {} braces in the text, DO NOT translate them keep them as is. ' },
                                { role: 'user', content: prompt_2 }
                            ],
                            temperature: 0.3,
                            max_tokens: 2000,
                        })];
                case 3:
                    response = _d.sent();
                    translationText = (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
                    if (!translationText) {
                        throw new Error('No translation returned from OpenAI');
                    }
                    translationBlocks = translationText.split('-----').map(function (block) { return block.trim(); });
                    translations = translationBlocks.map(function (block) {
                        var match = block.match(/^\d+\.\s+(.+)$/s);
                        return match ? match[1].trim() : block.trim();
                    });
                    // Ensure we have the right number of translations
                    if (translations.length !== texts.length) {
                        throw new Error("Expected ".concat(texts.length, " translations but got ").concat(translations.length));
                    }
                    return [2 /*return*/, translations];
                case 4:
                    error_2 = _d.sent();
                    if (error_2 instanceof Error) {
                        throw new Error("Batch translation failed: ".concat(error_2.message));
                    }
                    throw new Error('Batch translation failed with unknown error');
                case 5: return [2 /*return*/];
            }
        });
    });
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
function translateEntries(entries_1, sourceLocale_1, targetLocale_1, model_1) {
    return __awaiter(this, arguments, void 0, function (entries, sourceLocale, targetLocale, model, mock, onProgress, formality) {
        var keys, total, result_1, _i, keys_1, key, result, i, batchKeys, batchTexts, translations, j, error_3, _a, batchKeys_1, key, _b, _c, innerError_1;
        if (mock === void 0) { mock = false; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    keys = Object.keys(entries);
                    total = keys.length;
                    if (total === 0) {
                        return [2 /*return*/, {}];
                    }
                    // If mock mode is enabled, return mock translations
                    if (mock) {
                        result_1 = {};
                        for (_i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                            key = keys_1[_i];
                            result_1[key] = createMockTranslation(entries[key], targetLocale);
                            if (onProgress) {
                                onProgress(Object.keys(result_1).length, total, key);
                            }
                        }
                        return [2 /*return*/, result_1];
                    }
                    result = {};
                    i = 0;
                    _d.label = 1;
                case 1:
                    if (!(i < total)) return [3 /*break*/, 12];
                    batchKeys = keys.slice(i, i + MAX_BATCH_SIZE);
                    batchTexts = batchKeys.map(function (key) { return entries[key]; });
                    // Call the first key as current for progress reporting
                    if (onProgress) {
                        onProgress(Object.keys(result).length, total, batchKeys[0]);
                    }
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, 4, , 11]);
                    return [4 /*yield*/, translateBatch(batchTexts, sourceLocale, targetLocale, model, mock, formality)];
                case 3:
                    translations = _d.sent();
                    // Associate translations with their keys
                    for (j = 0; j < batchKeys.length; j++) {
                        result[batchKeys[j]] = translations[j];
                    }
                    // Report progress after batch completion
                    if (onProgress) {
                        onProgress(Object.keys(result).length, total);
                    }
                    return [3 /*break*/, 11];
                case 4:
                    error_3 = _d.sent();
                    _a = 0, batchKeys_1 = batchKeys;
                    _d.label = 5;
                case 5:
                    if (!(_a < batchKeys_1.length)) return [3 /*break*/, 10];
                    key = batchKeys_1[_a];
                    if (!!result[key]) return [3 /*break*/, 9];
                    _d.label = 6;
                case 6:
                    _d.trys.push([6, 8, , 9]);
                    if (onProgress) {
                        onProgress(Object.keys(result).length, total, key);
                    }
                    _b = result;
                    _c = key;
                    return [4 /*yield*/, translateContent(entries[key], sourceLocale, targetLocale, model, mock, formality)];
                case 7:
                    _b[_c] = _d.sent();
                    return [3 /*break*/, 9];
                case 8:
                    innerError_1 = _d.sent();
                    // Skip this key on failure
                    console.error("Failed to translate key: ".concat(key), innerError_1);
                    return [3 /*break*/, 9];
                case 9:
                    _a++;
                    return [3 /*break*/, 5];
                case 10: return [3 /*break*/, 11];
                case 11:
                    i += MAX_BATCH_SIZE;
                    return [3 /*break*/, 1];
                case 12: return [2 /*return*/, result];
            }
        });
    });
}
