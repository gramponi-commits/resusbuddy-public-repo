import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type JsonObject = Record<string, any>;

// Critical medical terms that need careful validation
const CRITICAL_KEYS = [
  'actions.shock',
  'actions.epinephrine',
  'actions.amiodarone',
  'actions.lidocaine',
  'actions.rosc',
  'actions.termination',
  'rhythm.vfPvt',
  'rhythm.asystole',
  'rhythm.pea',
  'postRosc.roscAchieved',
  'banner.startCPR',
  'banner.startCPRSub',
  'rhythmCheckModal.title',
  'timers.rhythmCheck',
  'timers.giveEpi',
  'codeEnded.title',
];

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

// Note: This is a placeholder function. In actual implementation,
// this would call the translator droid or a translation API
async function validateBackTranslation(langCode: string): Promise<{
  errors: string[];
  warnings: string[];
}> {
  const enPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'en.json');
  const langPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', `${langCode}.json`);

  const en = loadJson(enPath);
  const lang = loadJson(langPath);

  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('\n📝 Back-translation check requires manual review');
  console.log('   (Integrate translator droid for automated back-translation)\n');

  // Check critical keys exist
  for (const key of CRITICAL_KEYS) {
    const enValue = getNestedValue(en, key);
    const langValue = getNestedValue(lang, key);

    if (!langValue) {
      errors.push(`CRITICAL MISSING: ${key}`);
    }
  }

  // Placeholder for automated validation
  // TODO: Integrate translator droid to back-translate critical terms
  // TODO: Compare back-translated English with original
  // TODO: Flag semantic differences

  return { errors, warnings };
}

// Run validation for a specific language
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
  const result = await validateBackTranslation(langCode);

  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log('✓ Back-translation: PASSED (automated check skipped)');
  } else {
    console.log('⚠️  Back-translation: NEEDS REVIEW');
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
