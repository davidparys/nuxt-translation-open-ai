"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.translateProject = translateProject;
var path_1 = require("path");
var fs_extra_1 = require("fs-extra");
var ora_1 = require("ora");
var chalk_1 = require("chalk");
var nuxtConfigLoader_js_1 = require("../config/nuxtConfigLoader.js");
var openaiTranslator_js_1 = require("../openai/openaiTranslator.js");
var jsonUtils_js_1 = require("../utils/jsonUtils.js");
/**
 * Main function to translate a Nuxt i18n project
 * @param options Translation options
 */
function translateProject(options) {
    return __awaiter(this, void 0, void 0, function () {
        var nuxtConfig, langDir, fullLangDir, sourceLocale_1, sourceFilePath, sourceContent, flattenedSource, totalKeys, targetLocales, filteredTargetLocales, _loop_1, _i, filteredTargetLocales_1, targetLocale, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    return [4 /*yield*/, (0, nuxtConfigLoader_js_1.loadNuxtConfig)(options.rootDir)];
                case 1:
                    nuxtConfig = _a.sent();
                    if (!nuxtConfig.i18n) {
                        throw new Error('i18n configuration not found in Nuxt config');
                    }
                    langDir = nuxtConfig.i18n.langDir || 'locales';
                    fullLangDir = path_1.default.resolve(options.rootDir, langDir);
                    if (!fs_extra_1.default.existsSync(fullLangDir)) {
                        throw new Error("Language directory not found at ".concat(fullLangDir));
                    }
                    sourceLocale_1 = options.sourceLocale;
                    if (!sourceLocale_1) {
                        throw new Error('Source locale not specified');
                    }
                    sourceFilePath = void 0;
                    if (nuxtConfig.i18n.lazy) {
                        // In lazy loading mode, each locale has its own file
                        sourceFilePath = findLocaleFile(fullLangDir, sourceLocale_1, nuxtConfig.i18n);
                    }
                    else {
                        // In non-lazy mode, all locales are in a single file named by locale code
                        sourceFilePath = path_1.default.resolve(fullLangDir, "".concat(sourceLocale_1, ".json"));
                    }
                    if (!fs_extra_1.default.existsSync(sourceFilePath)) {
                        throw new Error("Source language file not found at ".concat(sourceFilePath));
                    }
                    return [4 /*yield*/, fs_extra_1.default.readJson(sourceFilePath)];
                case 2:
                    sourceContent = _a.sent();
                    flattenedSource = (0, jsonUtils_js_1.flattenObject)(sourceContent);
                    totalKeys = Object.keys(flattenedSource).length;
                    console.log(chalk_1.default.blue("Found ".concat(totalKeys, " keys in source language file")));
                    targetLocales = options.targetLocales || [];
                    filteredTargetLocales = targetLocales.filter(function (locale) {
                        return locale !== sourceLocale_1 &&
                            locale !== sourceLocale_1 + '.json' &&
                            !locale.includes("".concat(sourceLocale_1, ".")) &&
                            !locale.toLowerCase().includes("".concat(sourceLocale_1.toLowerCase()));
                    });
                    if (filteredTargetLocales.length === 0) {
                        console.log(chalk_1.default.yellow('No valid target locales found after filtering out the source locale.'));
                        return [2 /*return*/];
                    }
                    _loop_1 = function (targetLocale) {
                        var localeCode, spinner, targetFilePath, sourceFileName, targetFileName, existingTranslations, targetContent, error_2, keysToTranslate, interrupted, handleInterruption, pendingTranslations, _b, keysToTranslate_1, key, onProgress, newTranslations, translatedEntries, finalTranslations, error_3, translatedEntries, completedCount, _c, keysToTranslate_2, key, value, translatedValue, error_4, finalTranslations;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    localeCode = extractLocaleCode(targetLocale);
                                    spinner = (0, ora_1.default)("Translating to ".concat(targetLocale, " (").concat(localeCode, ")...")).start();
                                    targetFilePath = void 0;
                                    if (nuxtConfig.i18n.lazy) {
                                        targetFilePath = findLocaleFile(fullLangDir, localeCode, nuxtConfig.i18n);
                                        // If file doesn't exist, create it based on source locale file naming pattern
                                        if (!fs_extra_1.default.existsSync(targetFilePath)) {
                                            sourceFileName = path_1.default.basename(sourceFilePath);
                                            targetFileName = sourceFileName.replace(sourceLocale_1, localeCode);
                                            targetFilePath = path_1.default.resolve(fullLangDir, targetFileName);
                                        }
                                    }
                                    else {
                                        // Always use the exact locale code for the file name
                                        targetFilePath = path_1.default.resolve(fullLangDir, "".concat(localeCode, ".json"));
                                    }
                                    existingTranslations = {};
                                    if (!fs_extra_1.default.existsSync(targetFilePath)) return [3 /*break*/, 4];
                                    _d.label = 1;
                                case 1:
                                    _d.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, fs_extra_1.default.readJson(targetFilePath)];
                                case 2:
                                    targetContent = _d.sent();
                                    existingTranslations = (0, jsonUtils_js_1.flattenObject)(targetContent);
                                    spinner.text = "Found existing translations for ".concat(localeCode, ", identifying missing keys...");
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_2 = _d.sent();
                                    spinner.warn("Error reading existing ".concat(localeCode, " translations, starting fresh"));
                                    return [3 /*break*/, 4];
                                case 4:
                                    keysToTranslate = Object.keys(flattenedSource).filter(function (key) { return !existingTranslations[key] || existingTranslations[key] === ''; });
                                    if (keysToTranslate.length === 0) {
                                        spinner.succeed("All ".concat(totalKeys, " keys already translated for ").concat(localeCode));
                                        return [2 /*return*/, "continue"];
                                    }
                                    spinner.text = "Translating ".concat(keysToTranslate.length, " missing keys to ").concat(localeCode, "...");
                                    interrupted = false;
                                    handleInterruption = function () {
                                        interrupted = true;
                                        spinner.text = 'Interruption received, saving current progress...';
                                    };
                                    process.on('SIGINT', handleInterruption);
                                    pendingTranslations = {};
                                    for (_b = 0, keysToTranslate_1 = keysToTranslate; _b < keysToTranslate_1.length; _b++) {
                                        key = keysToTranslate_1[_b];
                                        pendingTranslations[key] = flattenedSource[key];
                                    }
                                    _d.label = 5;
                                case 5:
                                    _d.trys.push([5, 9, , 18]);
                                    onProgress = function (completed, total, currentKey) {
                                        if (interrupted)
                                            return;
                                        if (currentKey) {
                                            spinner.text = "Translating to ".concat(localeCode, " [").concat(completed, "/").concat(total, "]: ").concat(currentKey);
                                        }
                                        else {
                                            spinner.text = "Translated ".concat(completed, "/").concat(total, " keys to ").concat(localeCode, "...");
                                        }
                                    };
                                    return [4 /*yield*/, (0, openaiTranslator_js_1.translateEntries)(pendingTranslations, sourceLocale_1, localeCode, options.model, options.mock, onProgress, options.formality)];
                                case 6:
                                    newTranslations = _d.sent();
                                    translatedEntries = __assign(__assign({}, existingTranslations), newTranslations);
                                    finalTranslations = (0, jsonUtils_js_1.unflattenObject)(translatedEntries);
                                    // Save to file
                                    return [4 /*yield*/, fs_extra_1.default.ensureDir(path_1.default.dirname(targetFilePath))];
                                case 7:
                                    // Save to file
                                    _d.sent();
                                    return [4 /*yield*/, fs_extra_1.default.writeJson(targetFilePath, finalTranslations, { spaces: 2 })];
                                case 8:
                                    _d.sent();
                                    if (interrupted) {
                                        spinner.succeed("Translation interrupted, saved progress (".concat(Object.keys(newTranslations).length, "/").concat(keysToTranslate.length, " keys) to ").concat(targetFilePath));
                                        process.exit(0);
                                    }
                                    else {
                                        spinner.succeed("Translated ".concat(Object.keys(newTranslations).length, " keys to ").concat(localeCode, " and saved to ").concat(targetFilePath));
                                    }
                                    return [3 /*break*/, 18];
                                case 9:
                                    error_3 = _d.sent();
                                    spinner.fail("Error during batch translation: ".concat(error_3.message));
                                    // Fallback to individual translations if batch fails
                                    spinner.text = "Falling back to individual translations...";
                                    translatedEntries = __assign({}, existingTranslations);
                                    completedCount = 0;
                                    _c = 0, keysToTranslate_2 = keysToTranslate;
                                    _d.label = 10;
                                case 10:
                                    if (!(_c < keysToTranslate_2.length)) return [3 /*break*/, 15];
                                    key = keysToTranslate_2[_c];
                                    if (interrupted)
                                        return [3 /*break*/, 15];
                                    if (translatedEntries[key] && translatedEntries[key] !== '')
                                        return [3 /*break*/, 14]; // Skip if already translated
                                    _d.label = 11;
                                case 11:
                                    _d.trys.push([11, 13, , 14]);
                                    // Update spinner text with current key
                                    spinner.text = "Translating to ".concat(localeCode, " [").concat(completedCount + 1, "/").concat(keysToTranslate.length, "]: ").concat(key);
                                    value = flattenedSource[key];
                                    return [4 /*yield*/, (0, openaiTranslator_js_1.translateContent)(value, sourceLocale_1, localeCode, options.model, options.mock, options.formality)];
                                case 12:
                                    translatedValue = _d.sent();
                                    translatedEntries[key] = translatedValue;
                                    completedCount++;
                                    return [3 /*break*/, 14];
                                case 13:
                                    error_4 = _d.sent();
                                    spinner.text = "Error translating key ".concat(key, ": ").concat(error_4.message);
                                    return [3 /*break*/, 14];
                                case 14:
                                    _c++;
                                    return [3 /*break*/, 10];
                                case 15:
                                    finalTranslations = (0, jsonUtils_js_1.unflattenObject)(translatedEntries);
                                    // Save to file
                                    return [4 /*yield*/, fs_extra_1.default.ensureDir(path_1.default.dirname(targetFilePath))];
                                case 16:
                                    // Save to file
                                    _d.sent();
                                    return [4 /*yield*/, fs_extra_1.default.writeJson(targetFilePath, finalTranslations, { spaces: 2 })];
                                case 17:
                                    _d.sent();
                                    if (interrupted) {
                                        spinner.succeed("Translation interrupted, saved progress (".concat(completedCount, "/").concat(keysToTranslate.length, " keys) to ").concat(targetFilePath));
                                        process.exit(0);
                                    }
                                    else {
                                        spinner.succeed("Translated ".concat(completedCount, " keys to ").concat(localeCode, " and saved to ").concat(targetFilePath));
                                    }
                                    return [3 /*break*/, 18];
                                case 18:
                                    // Remove event listener
                                    process.removeListener('SIGINT', handleInterruption);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, filteredTargetLocales_1 = filteredTargetLocales;
                    _a.label = 3;
                case 3:
                    if (!(_i < filteredTargetLocales_1.length)) return [3 /*break*/, 6];
                    targetLocale = filteredTargetLocales_1[_i];
                    return [5 /*yield**/, _loop_1(targetLocale)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_1 = _a.sent();
                    throw new Error("Translation failed: ".concat(error_1.message));
                case 8: return [2 /*return*/];
            }
        });
    });
}
/**
 * Extracts the locale code from a locale string
 * @param locale Locale string which might be 'pl', 'pl.json', 'Polish', etc.
 * @returns The actual locale code (e.g., 'pl')
 */
function extractLocaleCode(locale) {
    // If it's a filename with .json extension, remove it
    if (locale.endsWith('.json')) {
        locale = locale.slice(0, -5);
    }
    // Common locale code patterns
    var commonLocales = {
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
    var lowerLocale = locale.toLowerCase();
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
function findLocaleFile(langDir, locale, i18nConfig) {
    if (!i18nConfig || !i18nConfig.locales) {
        return path_1.default.resolve(langDir, "".concat(locale, ".json"));
    }
    // Handle different formats of locales configuration
    if (Array.isArray(i18nConfig.locales)) {
        // Find the locale object in the array
        var localeObj = i18nConfig.locales.find(function (item) {
            if (typeof item === 'string') {
                return item === locale;
            }
            return item.code === locale;
        });
        if (typeof localeObj === 'object' && localeObj.file) {
            return path_1.default.resolve(langDir, localeObj.file);
        }
    }
    else if (typeof i18nConfig.locales === 'object' && !Array.isArray(i18nConfig.locales)) {
        // Handle object format
        var localeObj = i18nConfig.locales[locale];
        if (localeObj && localeObj.file) {
            return path_1.default.resolve(langDir, localeObj.file);
        }
    }
    // Default to locale code as filename
    return path_1.default.resolve(langDir, "".concat(locale, ".json"));
}
