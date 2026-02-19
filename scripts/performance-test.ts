import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type JsonObject = Record<string, any>;

// Calculate file size in different formats
function calculateFileSize(filePath: string): {
  bytes: number;
  kilobytes: number;
  megabytes: number;
  gzippedKilobytes: number;
} {
  const stats = fs.statSync(filePath);
  const bytes = stats.size;
  const kilobytes = bytes / 1024;
  const megabytes = kilobytes / 1024;

  // Estimate gzipped size (rough approximation: 30% of original)
  const gzippedKilobytes = kilobytes * 0.3;

  return {
    bytes,
    kilobytes: Math.round(kilobytes * 100) / 100,
    megabytes: Math.round(megabytes * 100) / 100,
    gzippedKilobytes: Math.round(gzippedKilobytes * 100) / 100
  };
}

// Count keys and strings in a JSON file
function analyzeJsonStructure(obj: JsonObject, depth: number = 0): {
  totalKeys: number;
  totalStrings: number;
  maxDepth: number;
  leafKeys: number;
} {
  let totalKeys = 0;
  let totalStrings = 0;
  let maxDepth = depth;
  let leafKeys = 0;

  for (const [key, value] of Object.entries(obj)) {
    totalKeys++;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const result = analyzeJsonStructure(value, depth + 1);
      totalKeys += result.totalKeys;
      totalStrings += result.totalStrings;
      maxDepth = Math.max(maxDepth, result.maxDepth);
      leafKeys += result.leafKeys;
    } else if (typeof value === 'string') {
      totalStrings++;
      leafKeys++;
      maxDepth = Math.max(maxDepth, depth);
    }
  }

  return {
    totalKeys,
    totalStrings,
    maxDepth,
    leafKeys
  };
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

// Test performance of a language file
function testLanguagePerformance(langCode: string): {
  fileSize: any;
  structure: any;
  parseTime: number;
} {
  const langPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', `${langCode}.json`);

  // Calculate file size
  const fileSize = calculateFileSize(langPath);

  // Analyze structure
  const lang = loadJson(langPath);
  const structure = analyzeJsonStructure(lang);

  // Measure parse time
  const parseStart = Date.now();
  const content = fs.readFileSync(langPath, 'utf-8');
  JSON.parse(content);
  const parseTime = Date.now() - parseStart;

  return {
    fileSize,
    structure,
    parseTime
  };
}

// Run performance tests
async function main() {
  console.log('\n⚡ Translation Performance Testing');
  console.log('='.repeat(55));

  // Languages to test
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

  let totalBytes = 0;
  let totalGzippedKB = 0;
  let totalParseTime = 0;

  const results: Array<{
    langCode: string;
    langName: string;
    fileSize: any;
    structure: any;
    parseTime: number;
  }> = [];

  for (const langCode of languages) {
    const result = testLanguagePerformance(langCode);

    console.log(`\n${languageNames[langCode] || langCode} (${langCode})`);
    console.log('─'.repeat(55));
    console.log(`File Size: ${result.fileSize.kilobytes} KB (${result.fileSize.megabytes} MB)`);
    console.log(`Gzipped: ${result.fileSize.gzippedKilobytes} KB`);
    console.log(`Total Keys: ${result.structure.totalKeys}`);
    console.log(`Leaf Keys: ${result.structure.leafKeys}`);
    console.log(`String Values: ${result.structure.totalStrings}`);
    console.log(`Max Depth: ${result.structure.maxDepth}`);
    console.log(`Parse Time: ${result.parseTime}ms`);

    totalBytes += result.fileSize.bytes;
    totalGzippedKB += result.fileSize.gzippedKilobytes;
    totalParseTime += result.parseTime;

    results.push({
      langCode,
      langName: languageNames[langCode] || langCode,
      fileSize: result.fileSize,
      structure: result.structure,
      parseTime: result.parseTime
    });
  }

  // Summary
  console.log('\n' + '='.repeat(55));
  console.log('PERFORMANCE SUMMARY');
  console.log('='.repeat(55));

  const totalMB = totalBytes / (1024 * 1024);
  const totalKB = totalBytes / 1024;

  console.log(`\nTotal File Size (All Languages):`);
  console.log(`  Bytes: ${totalBytes.toLocaleString()}`);
  console.log(`  Kilobytes: ${totalKB.toLocaleString()} KB`);
  console.log(`  Megabytes: ${totalMB.toFixed(2)} MB`);

  console.log(`\nTotal Gzipped Size (Estimated):`);
  console.log(`  Kilobytes: ${totalGzippedKB.toLocaleString()} KB`);
  console.log(`  Megabytes: ${(totalGzippedKB / 1024).toFixed(2)} MB`);

  console.log(`\nAverage Parse Time: ${(totalParseTime / languages.length).toFixed(2)}ms`);

  console.log(`\nFile Size Breakdown:`);
  const sortedBySize = [...results].sort((a, b) => b.fileSize.bytes - a.fileSize.bytes);
  console.log('\nLargest Files:');
  sortedBySize.slice(0, 10).forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.langName}: ${result.fileSize.kilobytes} KB`);
  });

  // Save results
  const perfResultsPath = path.join(__dirname, '..', 'PERFORMANCE_RESULTS.json');
  fs.writeFileSync(perfResultsPath, JSON.stringify({
    date: new Date().toISOString(),
    totalSize: {
      bytes: totalBytes,
      kilobytes: totalKB,
      megabytes: totalMB.toFixed(2),
      gzippedKB: totalGzippedKB,
      gzippedMB: (totalGzippedKB / 1024).toFixed(2)
    },
    averageParseTime: (totalParseTime / languages.length).toFixed(2),
    results
  }, null, 2));

  console.log(`\n📄 Results saved to: PERFORMANCE_RESULTS.json`);
  console.log('\n✅ Performance testing completed');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
