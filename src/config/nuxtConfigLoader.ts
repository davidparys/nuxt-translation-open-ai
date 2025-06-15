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
  
  // Find the start of the locales array
  const localesStartMatch = fileContent.match(/locales[\\s]*:[\\s]*\\[/);
  if (localesStartMatch) {
    const startIndex = localesStartMatch.index + localesStartMatch[0].length - 1; // Include the opening bracket
    
    // Find the matching closing bracket
    let depth = 0;
    let endIndex = -1;
    let inString = false;
    let stringChar = '';
    
    for (let i = startIndex; i < fileContent.length; i++) {
      const char = fileContent[i];
      const prevChar = i > 0 ? fileContent[i - 1] : '';
      
      // Handle string boundaries
      if ((char === '"' || char === "'") && prevChar !== '\\\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
      }
      
      if (!inString) {
        if (char === '[') {
          depth++;
        } else if (char === ']') {
          depth--;
          if (depth === 0) {
            endIndex = i;
            break;
          }
        }
      }
    }
    
    if (endIndex !== -1) {
      const localesStr = fileContent.substring(startIndex, endIndex + 1);
      
      // Use a more sophisticated approach to parse locale objects
      // This handles nested arrays and objects properly
      const localeObjects = parseLocaleObjects(localesStr);
      if (localeObjects.length > 0) {
        locales = localeObjects;
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
    }
  } else {
    // Try to find locales as an object
    const localesObjectMatch = fileContent.match(/locales[\\s]*:[\\s]*({[\\s\\S]*?})/);
    if (localesObjectMatch) {
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

// Helper function to parse locale objects with proper bracket matching
function parseLocaleObjects(localesStr) {
  const locales = [];
  let depth = 0;
  let currentObj = '';
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < localesStr.length; i++) {
    const char = localesStr[i];
    const prevChar = i > 0 ? localesStr[i - 1] : '';
    
    // Handle string boundaries
    if ((char === '"' || char === "'") && prevChar !== '\\\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
    }
    
    if (!inString) {
      if (char === '{') {
        if (depth === 0) {
          currentObj = '';
        }
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          // We've found a complete object
          currentObj += char;
          const localeObj = parseLocaleObject(currentObj);
          if (localeObj) {
            locales.push(localeObj);
          }
          currentObj = '';
          continue;
        }
      }
    }
    
    if (depth > 0) {
      currentObj += char;
    }
  }
  
  return locales;
}

// Helper function to parse a single locale object
function parseLocaleObject(objStr) {
  const codeMatch = objStr.match(/code[\\s]*:[\\s]*['"]([^'"]+)['"]/);
  const fileMatch = objStr.match(/file[\\s]*:[\\s]*['"]([^'"]+)['"]/);
  const nameMatch = objStr.match(/name[\\s]*:[\\s]*['"]([^'"]+)['"]/);
  
  // Look for files array
  const filesMatch = objStr.match(/files[\\s]*:[\\s]*(\\[[\\s\\S]*?\\])/);
  let files = [];
  if (filesMatch) {
    const filesStr = filesMatch[1];
    const fileMatches = filesStr.match(/['"]([^'"]+)['"]/g);
    if (fileMatches) {
      files = fileMatches.map(m => m.replace(/['"]/g, ''));
    }
  }
  
  if (codeMatch) {
    const localeObj = {
      code: codeMatch[1],
      name: nameMatch ? nameMatch[1] : codeMatch[1]
    };
    
    // Add files array if present, otherwise use single file
    if (files.length > 0) {
      localeObj.files = files;
    } else {
      localeObj.file = fileMatch ? fileMatch[1] : codeMatch[1] + '.json';
    }
    
    return localeObj;
  }
  return null;
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