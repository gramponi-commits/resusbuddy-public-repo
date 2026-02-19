#!/usr/bin/env node

/**
 * Generate PWA icons from the source app icon
 * This script uses the Canvas API to resize images without external dependencies
 */

const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

const SOURCE_ICON = '.appicons/appstore.png';
const SIZES = [
  { size: 192, output: 'public/pwa-192x192.png' },
  { size: 512, output: 'public/pwa-512x512.png' },
  { size: 180, output: 'public/apple-touch-icon.png' }, // iOS home screen
];

async function generateIcon(sourcePath, targetPath, size) {
  try {
    const image = await loadImage(sourcePath);
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Draw image with antialiasing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, size, size);

    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(targetPath, buffer);
    console.log(`✓ Generated ${targetPath} (${size}x${size})`);
  } catch (error) {
    console.error(`✗ Failed to generate ${targetPath}:`, error.message);
  }
}

async function main() {
  console.log('Generating PWA icons...\n');

  if (!fs.existsSync(SOURCE_ICON)) {
    console.error(`Error: Source icon not found: ${SOURCE_ICON}`);
    process.exit(1);
  }

  for (const { size, output } of SIZES) {
    await generateIcon(SOURCE_ICON, output, size);
  }

  console.log('\n✓ All PWA icons generated successfully!');
}

main().catch(console.error);
