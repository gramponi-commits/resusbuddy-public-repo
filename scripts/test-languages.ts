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
    return {};
  }
}

// Test a language file
function testLanguageFile(langCode: string): {
  errors: string[];
  warnings: string[];
  stats: {
    totalKeys: number;
    totalCharacters: number;
    averageStringLength: number;
    maxStringLength: number;
    placeholderCount: number;
  };
} {
  const enPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'en.json');
  const langPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', `${langCode}.json`);

  const en = loadJson(enPath);
  const lang = loadJson(langPath);

  const errors: string[] = [];
  const warnings: string[] = [];

  // Get all keys
  const enKeys = getAllKeys(en);
  const langKeys = getAllKeys(lang);

  let totalCharacters = 0;
  let placeholderCount = 0;
  let maxStringLength = 0;

  // Test each key
  for (const key of enKeys) {
    const enValue = getNestedValue(en, key);
    const langValue = getNestedValue(lang, key);

    // Check if translation exists
    if (!langValue) {
      errors.push(`MISSING TRANSLATION: ${key}`);
      continue;
    }

    // Check if value is a string
    if (typeof langValue !== 'string') {
      errors.push(`NON-STRING VALUE: ${key}`);
      continue;
    }

    // Check for empty strings
    if (langValue.trim() === '') {
      errors.push(`EMPTY TRANSLATION: ${key}`);
    }

    // Check for placeholders
    const enPlaceholders = (enValue as string).match(/\{\{[\w]+\}\}/g) || [];
    const langPlaceholders = langValue.match(/\{\{[\w]+\}\}/g) || [];
    placeholderCount += langPlaceholders.length;

    if (JSON.stringify(enPlaceholders.sort()) !== JSON.stringify(langPlaceholders.sort())) {
      errors.push(`PLACEHOLDER MISMATCH: ${key}\n  English: ${enPlaceholders.join(', ') || 'none'}\n  ${langCode}: ${langPlaceholders.join(', ') || 'none'}`);
    }

    // Collect stats
    const length = langValue.length;
    totalCharacters += length;
    if (length > maxStringLength) {
      maxStringLength = length;
    }

    // Check for unusually long translations
    const enLength = (enValue as string).length;
    const ratio = length / enLength;
    if (ratio > 2.5 && length > 50) {
      warnings.push(`LONG TRANSLATION: ${key}\n  English: ${enLength} chars\n  ${langCode}: ${length} chars (${ratio.toFixed(1)}x longer)`);
    }
  }

  // Check for extra keys
  for (const key of langKeys) {
    if (!enKeys.includes(key)) {
      warnings.push(`EXTRA KEY: ${key}`);
    }
  }

  return {
    errors,
    warnings,
    stats: {
      totalKeys: langKeys.length,
      totalCharacters,
      averageStringLength: langKeys.length > 0 ? Math.round(totalCharacters / langKeys.length) : 0,
      maxStringLength,
      placeholderCount
    }
  };
}

// Run tests
async function main() {
  console.log('\n🧪 Translation Functional Testing');
  console.log('='.repeat(55));

  // Languages to test (excluding hi, bn, he as pending)
  const languages = [
    // Existing
    'en', 'it', 'es', 'fr', 'de', 'el',
    // Newly validated
    'ru', 'uk', 'zh-CN', 'ja', 'ko', 'pt', 'id',
    'nl', 'da', 'sv', 'no', 'pl', 'tr', 'vi',
    'tl', 'ar', 'fa', 'th'
  ];

  const languageNames: Record<string, string> = {
    'en': 'English',
    'it': 'Italian',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'el': 'Greek',
    'ru': 'Russian',
    'uk': 'Ukrainian',
    'zh-CN': 'Chinese (Simplified)',
    'ja': 'Japanese',
    'ko': 'Korean',
    'pt': 'Portuguese',
    'id': 'Indonesian',
    'nl': 'Dutch',
    'da': 'Danish',
    'sv': 'Swedish',
    'no': 'Norwegian',
    'pl': 'Polish',
    'tr': 'Turkish',
    'vi': 'Vietnamese',
    'tl': 'Filipino/Tagalog',
    'ar': 'Arabic',
    'fa': 'Persian/Farsi',
    'th': 'Thai'
  };

  const languageGroups: Record<string, string> = {
    'ru': 'Cyrillic', 'uk': 'Cyrillic',
    'zh-CN': 'CJK', 'ja': 'CJK', 'ko': 'CJK',
    'ar': 'RTL', 'fa': 'RTL',
    'th': 'Complex Script'
  };

  let totalErrors = 0;
  let totalWarnings = 0;
  const results: Array<{
    langCode: string;
    langName: string;
    group: string;
    status: 'PASSED' | 'FAILED' | 'WARNING';
    errors: number;
    warnings: number;
    stats: any;
  }> = [];

  for (const langCode of languages) {
    console.log(`\nTesting: ${languageNames[langCode] || langCode} (${langCode})`);
    console.log('─'.repeat(55));

    const result = testLanguageFile(langCode);
    const group = languageGroups[langCode] || 'Latin';

    let status: 'PASSED' | 'FAILED' | 'WARNING';
    if (result.errors.length > 0) {
      status = 'FAILED';
    } else if (result.warnings.length > 0) {
      status = 'WARNING';
    } else {
      status = 'PASSED';
    }

    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;

    console.log(`Status: ${status}`);
    console.log(`Total Keys: ${result.stats.totalKeys}`);
    console.log(`Total Characters: ${result.stats.totalCharacters}`);
    console.log(`Avg String Length: ${result.stats.averageStringLength} chars`);
    console.log(`Max String Length: ${result.stats.maxStringLength} chars`);
    console.log(`Placeholders: ${result.stats.placeholderCount}`);

    if (result.errors.length > 0) {
      console.log(`\n❌ Errors (${result.errors.length}):`);
      for (const error of result.errors) {
        console.log(`  - ${error}`);
      }
    }

    if (result.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${result.warnings.length}):`);
      for (const warning of result.warnings) {
        console.log(`  - ${warning}`);
      }
    }

    results.push({
      langCode,
      langName: languageNames[langCode] || langCode,
      group,
      status,
      errors: result.errors.length,
      warnings: result.warnings.length,
      stats: result.stats
    });
  }

  // Summary
  console.log('\n' + '='.repeat(55));
  console.log('TESTING SUMMARY');
  console.log('='.repeat(55));

  const passed = results.filter(r => r.status === 'PASSED').length;
  const warnings = results.filter(r => r.status === 'WARNING').length;
  const failed = results.filter(r => r.status === 'FAILED').length;

  console.log(`\n✅ PASSED: ${passed} / ${results.length}`);
  console.log(`⚠️  WARNING: ${warnings} / ${results.length}`);
  console.log(`❌ FAILED: ${failed} / ${results.length}`);
  console.log(`\nTotal Errors: ${totalErrors}`);
  console.log(`Total Warnings: ${totalWarnings}`);
  console.log(`\nSuccess Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

  // Save results to JSON
  const resultsPath = path.join(__dirname, '..', 'TEST_RESULTS.json');
  fs.writeFileSync(resultsPath, JSON.stringify({
    date: new Date().toISOString(),
    languages,
    results
  }, null, 2));

  console.log(`\n📄 Results saved to: TEST_RESULTS.json`);

  if (failed > 0) {
    console.log('\n❌ Testing completed with failures');
    process.exit(1);
  } else {
    console.log('\n✅ Testing completed successfully');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
