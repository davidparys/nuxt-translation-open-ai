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
exports.setupCli = setupCli;
var commander_1 = require("commander");
var chalk_1 = require("chalk");
var translator_js_1 = require("../translator/translator.js");
var nuxtConfigLoader_js_1 = require("../config/nuxtConfigLoader.js");
/**
 * Sets up the command-line interface for the translator
 */
function setupCli() {
    var _this = this;
    var program = new commander_1.Command();
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
        .action(function (options) { return __awaiter(_this, void 0, void 0, function () {
        var translationOptions_1, nuxtConfig, allLocales, sourceLocale_1, normalizedLocales_1, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, , 4]);
                    console.log(chalk_1.default.blue('Vue i18n Translator'));
                    console.log(chalk_1.default.dim('Initializing translation process...\n'));
                    translationOptions_1 = {
                        rootDir: options.root || process.env.ROOT_DIRECTORY || process.cwd(),
                        sourceLocale: options.source || process.env.DEFAULT_LOCALE,
                        targetLocales: options.target ? options.target.split(',') :
                            process.env.TARGET_LOCALES ? process.env.TARGET_LOCALES.split(',') : undefined,
                        model: options.model || process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                        mock: options.mock || false,
                        formality: options.formality || process.env.FORMALITY_LEVEL
                    };
                    return [4 /*yield*/, (0, nuxtConfigLoader_js_1.loadNuxtConfig)(translationOptions_1.rootDir)];
                case 1:
                    nuxtConfig = _c.sent();
                    // If sourceLocale is not specified, use the one from Nuxt config
                    if (!translationOptions_1.sourceLocale && ((_a = nuxtConfig.i18n) === null || _a === void 0 ? void 0 : _a.defaultLocale)) {
                        translationOptions_1.sourceLocale = nuxtConfig.i18n.defaultLocale;
                    }
                    // If targetLocales is not specified, use all locales from Nuxt config except the source
                    if (!translationOptions_1.targetLocales && ((_b = nuxtConfig.i18n) === null || _b === void 0 ? void 0 : _b.locales)) {
                        allLocales = Array.isArray(nuxtConfig.i18n.locales)
                            ? nuxtConfig.i18n.locales.map(function (locale) {
                                return typeof locale === 'string' ? locale : locale.code;
                            })
                            : Object.keys(nuxtConfig.i18n.locales);
                        translationOptions_1.targetLocales = allLocales.filter(function (locale) { return locale !== translationOptions_1.sourceLocale; });
                    }
                    // Always ensure the source locale is not in target locales
                    if (translationOptions_1.targetLocales && translationOptions_1.sourceLocale) {
                        sourceLocale_1 = translationOptions_1.sourceLocale;
                        normalizedLocales_1 = new Map();
                        translationOptions_1.targetLocales.forEach(function (locale) {
                            var normalizedCode = normalizeLocaleCode(locale);
                            if (normalizedCode &&
                                normalizedCode !== sourceLocale_1 &&
                                !isLocaleEquivalent(normalizedCode, sourceLocale_1)) {
                                // Use the normalized code as the key to deduplicate
                                normalizedLocales_1.set(normalizedCode, locale);
                            }
                        });
                        // Convert back to array
                        translationOptions_1.targetLocales = Array.from(normalizedLocales_1.keys());
                    }
                    // Validate options
                    if (!translationOptions_1.sourceLocale) {
                        throw new Error('Source locale not found. Please specify it with --source option or in nuxt.config.ts');
                    }
                    if (!translationOptions_1.targetLocales || translationOptions_1.targetLocales.length === 0) {
                        throw new Error('No target locales found. Please specify them with --target option or in nuxt.config.ts');
                    }
                    // Display configuration
                    console.log(chalk_1.default.green('Configuration:'));
                    console.log("Root directory: ".concat(chalk_1.default.yellow(translationOptions_1.rootDir)));
                    console.log("Source locale: ".concat(chalk_1.default.yellow(translationOptions_1.sourceLocale)));
                    console.log("Target locales: ".concat(chalk_1.default.yellow(translationOptions_1.targetLocales.join(', '))));
                    console.log("OpenAI model: ".concat(chalk_1.default.yellow(translationOptions_1.model)));
                    if (translationOptions_1.formality) {
                        console.log("Formality level: ".concat(chalk_1.default.yellow(translationOptions_1.formality)));
                    }
                    if (translationOptions_1.mock) {
                        console.log(chalk_1.default.yellow("MOCK MODE: No actual API calls will be made"));
                    }
                    console.log('');
                    // Start translation process
                    return [4 /*yield*/, (0, translator_js_1.translateProject)(translationOptions_1)];
                case 2:
                    // Start translation process
                    _c.sent();
                    console.log(chalk_1.default.green('\nTranslation completed successfully!'));
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _c.sent();
                    console.error(chalk_1.default.red('Error:'), error_1.message);
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    program.parse();
}
/**
 * Normalizes a locale code by removing .json extension and converting to lowercase
 * @param locale The locale string to normalize
 * @returns Normalized locale code
 */
function normalizeLocaleCode(locale) {
    // Remove .json extension if present
    if (locale.endsWith('.json')) {
        locale = locale.slice(0, -5);
    }
    // Map of common language names to ISO codes
    var languageMap = {
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
    var lowerLocale = locale.toLowerCase();
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
function isLocaleEquivalent(localeA, localeB) {
    // Normalize both locales
    var normalizedA = normalizeLocaleCode(localeA);
    var normalizedB = normalizeLocaleCode(localeB);
    // Check if they're the same after normalization
    return normalizedA === normalizedB;
}
