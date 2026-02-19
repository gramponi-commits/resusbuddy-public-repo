import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type JsonObject = Record<string, any>;

// Critical medical terms to cross-validate
const CRITICAL_KEYS = [
  'actions.shock',
  'actions.epinephrine',
  'actions.amiodarone',
  'actions.lidocaine',
  'rhythm.vfPvt',
  'rhythm.asystole',
  'rhythm.pea',
  'postRosc.roscAchieved',
  'banner.startCPR',
  'rhythmCheckModal.title',
  'timers.rhythmCheck',
  'timers.giveEpi',
  'codeEnded.title',
];

// Reference languages for consistency check
const REFERENCE_LANGUAGES = ['es', 'fr', 'it'];

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

// Cross-validate terminology against reference languages
async function crossValidateTerminology(langCode: string): Promise<{
  errors: string[];
  warnings: string[];
}> {
  const enPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'en.json');
  const langPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', `${langCode}.json`);

  const en = loadJson(enPath);
  const lang = loadJson(langPath);

  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('\n🔄 Cross-language consistency check');
  console.log('   (Integrate LLM for automated consistency analysis)\n');

  // Load reference languages
  const referenceTranslations: { [lang: string]: string } = {};
  for (const refLang of REFERENCE_LANGUAGES) {
    const refPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', `${refLang}.json`);
    const refData = loadJson(refPath);
    for (const key of CRITICAL_KEYS) {
      const value = getNestedValue(refData, key);
      if (value && typeof value === 'string') {
        referenceTranslations[`${refLang}:${key}`] = value;
      }
    }
  }

  // Check critical keys exist in target language
  for (const key of CRITICAL_KEYS) {
    const enValue = getNestedValue(en, key);
    const langValue = getNestedValue(lang, key);

    if (!langValue) {
      errors.push(`CRITICAL MISSING: ${key}`);
    }

    // TODO: Use LLM to compare terminology consistency
    // For now, just check that the value exists
    if (langValue && typeof langValue === 'string') {
      const enLength = enValue.length;
      const langLength = langValue.length;
      const ratio = langLength / enLength;

      // Flag unusually long translations (possible expansion issues)
      if (ratio > 2.5) {
        warnings.push(`LONG TRANSLATION: ${key}\n  English: ${enValue.length} chars\n  ${langCode}: ${langValue.length} chars (${ratio.toFixed(1)}x longer)`);
      }
    }
  }

  // Placeholder for LLM integration
  // TODO: Compare new language terminology with ES/FR consensus
  // TODO: Use LLM to detect outliers
  // TODO: Flag inconsistent medical terminology

  return { errors, warnings };
}

// Run cross-validation for a specific language
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: npm run validate:translation -- --lang=ru');
    process.exit(1);
  }

  const langArg = args.find(arg => arg.startsWith('--lang='));
  if (!langArg) {
    console.error('Error: --lang argument required');
    process.exit(1);
  }

  const langCode = langArg.split('=')[1];
  const result = await crossValidateTerminology(langCode);

  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log('✓ Cross-language consistency: PASSED (automated check skipped)');
  } else {
    console.log('⚠️  Cross-language consistency: NEEDS REVIEW');
    for (const error of result.errors) {
      console.log(`  ❌ ${error}`);
    }
    for (const warning of result.warnings) {
      console.log(`  ⚠️  ${warning}`);
    }
  }

  if (result.errors.length > 0) {
    console.log('\nRESULT: CRITICAL ISSUES FOUND');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
