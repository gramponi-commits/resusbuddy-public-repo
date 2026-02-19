import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');

// New intervention keys to add (English version for reference)
const newInterventionKeys = {
  anaphylaxisActivated: "Anaphylaxis protocol activated",
  asthmaActivated: "Asthma / Severe Bronchospasm protocol activated",
  hyperthermiaActivated: "Hyperthermia / Heat Stroke protocol activated",
  opioidOverdoseActivated: "Opioid Overdose protocol activated",
  drowningActivated: "Drowning protocol activated",
  electrocutionActivated: "Electrocution protocol activated",
  lvadFailureActivated: "LVAD Failure protocol activated"
};

// For non-English files, use placeholders that indicate translation is needed
const placeholderKeys = {
  anaphylaxisActivated: "[TRANSLATE] Anaphylaxis protocol activated",
  asthmaActivated: "[TRANSLATE] Asthma / Severe Bronchospasm protocol activated",
  hyperthermiaActivated: "[TRANSLATE] Hyperthermia / Heat Stroke protocol activated",
  opioidOverdoseActivated: "[TRANSLATE] Opioid Overdose protocol activated",
  drowningActivated: "[TRANSLATE] Drowning protocol activated",
  electrocutionActivated: "[TRANSLATE] Electrocution protocol activated",
  lvadFailureActivated: "[TRANSLATE] LVAD Failure protocol activated"
};

const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

files.forEach(file => {
  const filePath = path.join(localesDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  
  // Check if interventions section exists and if keys are already present
  if (data.interventions && !data.interventions.anaphylaxisActivated) {
    // Use English text for en.json, placeholders for others
    const keysToAdd = file === 'en.json' ? newInterventionKeys : placeholderKeys;
    
    // Add new keys after pregnancyActivated
    Object.assign(data.interventions, keysToAdd);
    
    // Write back with proper formatting
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    console.log(`Updated ${file}`);
  } else if (data.interventions?.anaphylaxisActivated) {
    console.log(`Skipped ${file} - keys already exist`);
  } else {
    console.log(`Warning: ${file} has no interventions section`);
  }
});

console.log('\\nAdded special circumstance intervention keys to all translation files');
console.log('Non-English files have [TRANSLATE] placeholders that need translation');
