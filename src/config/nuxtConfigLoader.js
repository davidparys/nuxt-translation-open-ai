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
exports.loadNuxtConfig = loadNuxtConfig;
var fs_1 = require("fs");
var path_1 = require("path");
var child_process_1 = require("child_process");
var fs_2 = require("fs");
/**
 * Extracts i18n configuration from a Nuxt project
 * @param rootDir Root directory of the Nuxt project
 * @returns Nuxt configuration object
 */
function loadNuxtConfig(rootDir) {
    return __awaiter(this, void 0, void 0, function () {
        var configPath, jsConfigPath, configExtractPath, extractScript, configJson, config;
        return __generator(this, function (_a) {
            configPath = (0, path_1.resolve)(rootDir, 'nuxt.config.ts');
            jsConfigPath = (0, path_1.resolve)(rootDir, 'nuxt.config.js');
            if (!(0, fs_1.existsSync)(configPath) && !(0, fs_1.existsSync)(jsConfigPath)) {
                throw new Error("Nuxt configuration file not found at ".concat(configPath, " or ").concat(jsConfigPath));
            }
            try {
                configExtractPath = (0, path_1.resolve)(rootDir, 'temp-config-extract.js');
                extractScript = "\nimport { readFileSync, existsSync, readdirSync } from 'fs';\nimport { resolve, join } from 'path';\n\n// Determine if we need to look for TS or JS config\nconst configPath = '".concat((0, fs_1.existsSync)(configPath) ? configPath.replace(/\\/g, '\\\\') : jsConfigPath.replace(/\\/g, '\\\\'), "';\nconst isTypeScript = configPath.endsWith('.ts');\nconst rootDir = '").concat(rootDir.replace(/\\/g, '\\\\'), "';\n\ntry {\n  // Read the file content as string\n  const fileContent = readFileSync(configPath, 'utf-8');\n  \n  // For both TS and JS files, look for i18n configuration\n  // This is a simple parser - it looks for patterns like i18n: { ... }\n  let i18nConfig = {};\n  \n  // Look for defaultLocale\n  const defaultLocaleMatch = fileContent.match(/defaultLocale[\\s]*:[\\s]*['\"]([^'\"]+)['\"]/);\n  let defaultLocale = defaultLocaleMatch ? defaultLocaleMatch[1] : 'en';\n  \n  // Look for locales array or object\n  let locales = [];\n  const localesArrayMatch = fileContent.match(/locales[\\s]*:[\\s]*(\\[[^\\]]+\\])/);\n  const localesObjectMatch = fileContent.match(/locales[\\s]*:[\\s]*({[^}]+})/);\n  \n  if (localesArrayMatch) {\n    // Try to extract locale codes from the array\n    const localesStr = localesArrayMatch[1];\n    const codeMatches = localesStr.match(/['\"]([^'\"]+)['\"]/g);\n    if (codeMatches) {\n      locales = codeMatches.map(m => m.replace(/['\"]/g, ''));\n    }\n  } else if (localesObjectMatch) {\n    // Try to extract locale codes from object keys\n    const localesStr = localesObjectMatch[1];\n    const codeMatches = localesStr.match(/['\"]([^'\"]+)['\"]/g);\n    if (codeMatches) {\n      locales = codeMatches.map(m => m.replace(/['\"]/g, ''));\n    }\n  }\n  \n  // If we couldn't parse locales, try to find locale files in common directories\n  if (locales.length === 0) {\n    const possibleDirs = [\n      'locales',\n      'i18n/locales',\n      'lang',\n      'langs',\n      'translations'\n    ];\n    \n    // Look for any directories that might contain locale files\n    for (const dir of possibleDirs) {\n      const dirPath = join(rootDir, dir);\n      if (existsSync(dirPath)) {\n        try {\n          const files = readdirSync(dirPath);\n          // Look for JSON files that might be locale files\n          const localeFiles = files.filter(file => file.endsWith('.json'));\n          if (localeFiles.length > 0) {\n            // Extract locale codes from filenames (remove .json extension)\n            locales = localeFiles.map(file => file.replace(/\\.json$/, ''));\n            break;\n          }\n        } catch (error) {\n          // Ignore directory access errors\n        }\n      }\n    }\n  }\n  \n  // Look for langDir\n  const langDirMatch = fileContent.match(/langDir[\\s]*:[\\s]*['\"]([^'\"]+)['\"]/);\n  let langDir = langDirMatch ? langDirMatch[1] : null;\n  \n  // Try to find langDir by checking common directories\n  if (!langDir) {\n    const possibleDirs = [\n      'locales',\n      'i18n/locales',\n      'lang',\n      'langs',\n      'translations'\n    ];\n    \n    for (const dir of possibleDirs) {\n      if (existsSync(join(rootDir, dir)) && \n          existsSync(join(rootDir, dir, defaultLocale + '.json'))) {\n        langDir = dir;\n        break;\n      }\n    }\n    \n    // If still not found, use the first directory that exists\n    if (!langDir) {\n      for (const dir of possibleDirs) {\n        if (existsSync(join(rootDir, dir))) {\n          langDir = dir;\n          break;\n        }\n      }\n    }\n    \n    // Default to 'locales' if nothing else was found\n    if (!langDir) {\n      langDir = 'i18n/locales'; // Common location in newer Nuxt projects\n    }\n  }\n  \n  // Create config object\n  i18nConfig = {\n    defaultLocale,\n    locales,\n    langDir\n  };\n  \n  // Create a Nuxt config with i18n\n  const nuxtConfig = {\n    i18n: i18nConfig\n  };\n  \n  console.log(JSON.stringify(nuxtConfig));\n} catch (error) {\n  console.error(error);\n  process.exit(1);\n}\n");
                // Write the extraction script to a temporary file
                (0, fs_2.writeFileSync)(configExtractPath, extractScript);
                configJson = (0, child_process_1.execSync)("node ".concat(configExtractPath), { encoding: 'utf-8' });
                // Clean up the temporary file
                (0, fs_2.unlinkSync)(configExtractPath);
                config = JSON.parse(configJson);
                // Validate i18n configuration
                if (!config.i18n) {
                    throw new Error('i18n configuration not found in Nuxt config');
                }
                return [2 /*return*/, config];
            }
            catch (error) {
                throw new Error("Failed to load Nuxt configuration: ".concat(error.message));
            }
            return [2 /*return*/];
        });
    });
}
