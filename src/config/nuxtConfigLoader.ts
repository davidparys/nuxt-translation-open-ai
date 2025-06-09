import { existsSync } from 'fs';
import { resolve } from 'path';
import { NuxtConfig } from '../types/options.js';
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';

/**
 * Extracts i18n configuration from a Nuxt project
 * @param rootDir Root directory of the Nuxt project
 * @returns Nuxt configuration object
 */
export async function loadNuxtConfig(rootDir: string): Promise<NuxtConfig> {
  const configPath = resolve(rootDir, 'nuxt.config.ts');
  const jsConfigPath = resolve(rootDir, 'nuxt.config.js');

  if (!existsSync(configPath) && !existsSync(jsConfigPath)) {
    throw new Error(`Nuxt configuration file not found at ${configPath} or ${jsConfigPath}`);
  }

  try {
    // We'll create a more robust approach to extract Nuxt configuration
    // Create a temporary script that reads and parses the config file directly using fs
    const configExtractPath = resolve(rootDir, 'temp-config-extract.js');

    // This script will work in both ESM and CommonJS environments
    const extractScript = `
import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

// Determine if we need to look for TS or JS config
const configPath = '${existsSync(configPath) ? configPath.replace(/\\/g, '\\\\') : jsConfigPath.replace(/\\/g, '\\\\')}';
const isTypeScript = configPath.endsWith('.ts');
const rootDir = '${rootDir.replace(/\\/g, '\\\\')}';

try {
  // Read the file content as string
  const fileContent = readFileSync(configPath, 'utf-8');
  
  // For both TS and JS files, look for i18n configuration
  // This is a simple parser - it looks for patterns like i18n: { ... }
  let i18nConfig = {};
  
  // Look for defaultLocale
  const defaultLocaleMatch = fileContent.match(/defaultLocale[\\s]*:[\\s]*['"]([^'"]+)['"]/);
  let defaultLocale = defaultLocaleMatch ? defaultLocaleMatch[1] : 'en';
  
  // Look for locales array or object
  let locales = [];
  const localesArrayMatch = fileContent.match(/locales[\\s]*:[\\s]*(\\[[\\s\\S]*?\\])/);
  const localesObjectMatch = fileContent.match(/locales[\\s]*:[\\s]*({[\\s\\S]*?})/);
  
  if (localesArrayMatch) {
    // Try to extract locale objects from the array
    const localesStr = localesArrayMatch[1];
    
    // Look for locale objects with code and file properties
    const localeObjectMatches = localesStr.match(/{[^}]*}/g);
    if (localeObjectMatches) {
      locales = localeObjectMatches.map(objStr => {
        const codeMatch = objStr.match(/code[\\s]*:[\\s]*['"]([^'"]+)['"]/);
        const fileMatch = objStr.match(/file[\\s]*:[\\s]*['"]([^'"]+)['"]/);
        const nameMatch = objStr.match(/name[\\s]*:[\\s]*['"]([^'"]+)['"]/);
        
        if (codeMatch) {
          return {
            code: codeMatch[1],
            file: fileMatch ? fileMatch[1] : codeMatch[1] + '.json',
            name: nameMatch ? nameMatch[1] : codeMatch[1]
          };
        }
        return null;
      }).filter(Boolean);
    } else {
      // Fallback: try to extract simple string codes
      const codeMatches = localesStr.match(/['"]([^'"]+)['"]/g);
      if (codeMatches) {
        locales = codeMatches.map(m => {
          const code = m.replace(/['"]/g, '');
          return {
            code: code,
            file: code + '.json',
            name: code
          };
        });
      }
    }
  } else if (localesObjectMatch) {
    // Try to extract locale codes from object keys
    const localesStr = localesObjectMatch[1];
    const codeMatches = localesStr.match(/['"]([^'"]+)['"]/g);
    if (codeMatches) {
      locales = codeMatches.map(m => {
        const code = m.replace(/['"]/g, '');
        return {
          code: code,
          file: code + '.json',
          name: code
        };
      });
    }
  }
  
  // If we couldn't parse locales, try to find locale files in common directories
  if (locales.length === 0) {
    const possibleDirs = [
      'locales',
      'i18n/locales',
      'lang',
      'langs',
      'translations'
    ];
    
    // Look for any directories that might contain locale files
    for (const dir of possibleDirs) {
      const dirPath = join(rootDir, dir);
      if (existsSync(dirPath)) {
        try {
          const files = readdirSync(dirPath);
          // Look for JSON files that might be locale files
          const localeFiles = files.filter(file => file.endsWith('.json'));
          if (localeFiles.length > 0) {
            // Create locale objects from filenames
            locales = localeFiles.map(file => {
              const code = file.replace(/\\.json$/, '');
              return {
                code: code,
                file: file,
                name: code
              };
            });
            break;
          }
        } catch (error) {
          // Ignore directory access errors
        }
      }
    }
  }
  
  // Look for langDir
  const langDirMatch = fileContent.match(/langDir[\\s]*:[\\s]*['"]([^'"]+)['"]/);
  let langDir = langDirMatch ? langDirMatch[1] : null;
  
  // Try to find langDir by checking common directories
  if (!langDir) {
    const possibleDirs = [
      'locales',
      'i18n/locales',
      'lang',
      'langs',
      'translations'
    ];
    
    for (const dir of possibleDirs) {
      if (existsSync(join(rootDir, dir)) && 
          existsSync(join(rootDir, dir, defaultLocale + '.json'))) {
        langDir = dir;
        break;
      }
    }
    
    // If still not found, use the first directory that exists
    if (!langDir) {
      for (const dir of possibleDirs) {
        if (existsSync(join(rootDir, dir))) {
          langDir = dir;
          break;
        }
      }
    }
    
    // Default to 'locales' if nothing else was found
    if (!langDir) {
      langDir = 'i18n/locales'; // Common location in newer Nuxt projects
    }
  }
  
  // Create config object
  i18nConfig = {
    defaultLocale,
    locales,
    langDir
  };
  
  // Create a Nuxt config with i18n
  const nuxtConfig = {
    i18n: i18nConfig
  };
  
  console.log(JSON.stringify(nuxtConfig));
} catch (error) {
  console.error(error);
  process.exit(1);
}
`;

    // Write the extraction script to a temporary file
    writeFileSync(configExtractPath, extractScript);

    // Execute the script with Node.js
    const configJson = execSync(`node ${configExtractPath}`, { encoding: 'utf-8' });

    // Clean up the temporary file
    unlinkSync(configExtractPath);

    // Parse the configuration
    const config = JSON.parse(configJson) as NuxtConfig;

    // Validate i18n configuration
    if (!config.i18n) {
      throw new Error('i18n configuration not found in Nuxt config');
    }

    return config;
  } catch (error) {
    throw new Error(`Failed to load Nuxt configuration: ${(error as Error).message}`);
  }
} 