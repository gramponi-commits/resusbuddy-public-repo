import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type JsonObject = Record<string, any>;

// Get all nested keys from an object
function getAllKeys(obj: JsonObject, prefix: string = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Get nested value by dot-notation key
function getNestedValue(obj: JsonObject, key: string): any {
  return key.split('.').reduce((current, k) => current?.[k], obj);
}

// Load a JSON file
function loadJson(filePath: string): JsonObject {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    process.exit(1);
  }
}

// Extract placeholder variables from a string
function extractPlaceholders(str: string): string[] {
  const matches = str.match(/\{\{[\w]+\}\}/g) || [];
  return matches.sort();
}

// Lint a translation file
function lintTranslationFile(langCode: string): {
  errors: string[];
  warnings: string[];
} {
  const enPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'en.json');
  const langPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', `${langCode}.json`);

  const en = loadJson(enPath);
  const lang = loadJson(langPath);

  const errors: string[] = [];
  const warnings: string[] = [];

  const enKeys = getAllKeys(en);
  const langKeys = getAllKeys(lang);

  // Check missing keys
  for (const key of enKeys) {
    if (!langKeys.includes(key)) {
      errors.push(`MISSING KEY: ${key}`);
    }
  }

  // Check extra keys
  for (const key of langKeys) {
    if (!enKeys.includes(key)) {
      warnings.push(`EXTRA KEY: ${key}`);
    }
  }

  // Check placeholders
  for (const key of enKeys) {
    const enValue = getNestedValue(en, key);
    const langValue = getNestedValue(lang, key);

    if (typeof enValue !== 'string' || typeof langValue !== 'string') {
      continue;
    }

    const enPlaceholders = extractPlaceholders(enValue);
    const langPlaceholders = extractPlaceholders(langValue);

    if (JSON.stringify(enPlaceholders) !== JSON.stringify(langPlaceholders)) {
      errors.push(`PLACEHOLDER MISMATCH: ${key}\n  English: ${enPlaceholders.join(', ') || 'none'}\n  ${langCode}: ${langPlaceholders.join(', ') || 'none'}`);
    }
  }

  // Check for empty string values
  for (const key of langKeys) {
    const langValue = getNestedValue(lang, key);
    if (typeof langValue === 'string' && langValue.trim() === '') {
      errors.push(`EMPTY VALUE: ${key}`);
    }
  }

  return { errors, warnings };
}

// Run lint for a specific language
function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: npm run validate:translation -- --lang=ru');
    console.error('   or: npm run validate:translations');
    process.exit(1);
  }

  const langArg = args.find(arg => arg.startsWith('--lang='));
  if (!langArg) {
    console.error('Error: --lang argument required');
    process.exit(1);
  }

  const langCode = langArg.split('=')[1];
  const result = lintTranslationFile(langCode);

  console.log(`\nValidating: ${langCode.toUpperCase()} (${langCode})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log('✓ Structural validation: PASSED (0 errors)');
  } else {
    console.log(`✗ Structural validation: FAILED (${result.errors.length} errors)`);
    for (const error of result.errors) {
      console.log(`  ❌ ${error}`);
    }
  }

  if (result.warnings.length > 0) {
    console.log(`⚠️  Warnings: ${result.warnings.length}`);
    for (const warning of result.warnings) {
      console.log(`  ⚠️  ${warning}`);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (result.errors.length > 0) {
    console.log('\nRESULT: FAILED - Fix errors above');
    process.exit(1);
  } else {
    console.log('\nRESULT: APPROVED');
  }
}

main();
