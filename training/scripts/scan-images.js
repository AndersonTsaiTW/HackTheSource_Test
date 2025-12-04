// Batch process all images in data_pics folder with OCR
// This script will:
// 1. Read all images from data_pics/fraud and data_pics/normal
// 2. Extract text using OCR for each image
// 3. Send to training API with correct label

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractTextFromImage } from '../../src/services/ocrService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PICS_DIR = path.join(__dirname, '../../data_pics');
const API_URL = 'http://localhost:3000/api/training/collect-training-data';

// Get all image files from a directory
function getImageFiles(dir) {
  const files = fs.readdirSync(dir);
  return files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
  }).map(file => path.join(dir, file));
}

// Collect all images with their labels
function collectAllImages() {
  const images = {
    fraud: [],
    normal: []
  };

  // Fraud images
  const fraudDir = path.join(DATA_PICS_DIR, 'fraud');
  if (fs.existsSync(fraudDir)) {
    images.fraud = getImageFiles(fraudDir).map(filePath => ({
      path: filePath.replace(/\\/g, '/'),
      label: 1,
      category: 'fraud'
    }));
  }

  // Normal images
  const normalDir = path.join(DATA_PICS_DIR, 'normal');
  if (fs.existsSync(normalDir)) {
    images.normal = getImageFiles(normalDir).map(filePath => ({
      path: filePath.replace(/\\/g, '/'),
      label: 0,
      category: 'normal'
    }));
  }

  return [...images.fraud, ...images.normal];
}

// Process a single image
async function processImage(image, index, total) {
  try {
    console.log(`\n[${index + 1}/${total}] Processing: ${path.basename(image.path)}`);
    console.log(`  Category: ${image.category} (label=${image.label})`);
    
    // Read image file
    const imageBuffer = fs.readFileSync(image.path);
    
    // Extract text using OCR
    console.log('  🔍 Running OCR...');
    const ocrText = await extractTextFromImage(imageBuffer);
    
    if (!ocrText || ocrText.trim().length === 0) {
      console.log('  ⚠️  No text extracted, skipping...');
      return { success: false, reason: 'No text found' };
    }
    
    console.log(`  📄 Extracted text (${ocrText.length} chars)`);
    
    // Send to training API
    console.log('  📤 Sending to API...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_path: image.path,
        ocr_text: ocrText,
        label: image.label
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`  ❌ API error: ${error}`);
      return { success: false, reason: error };
    }
    
    const result = await response.json();
    console.log(`  ✅ Success! Row added to CSV`);
    
    return { success: true, result };
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

// Main function
async function main() {
  console.log('🚀 Starting batch processing...\n');
  console.log('📁 Scanning data_pics directory...');
  
  const allImages = collectAllImages();
  
  if (allImages.length === 0) {
    console.log('❌ No images found in data_pics/fraud or data_pics/normal');
    return;
  }
  
  console.log(`\n📊 Found ${allImages.length} images:`);
  console.log(`  - Fraud: ${allImages.filter(img => img.label === 1).length}`);
  console.log(`  - Normal: ${allImages.filter(img => img.label === 0).length}`);
  console.log('\n' + '='.repeat(70));
  
  // Check if server is running
  try {
    await fetch('http://localhost:3000/health');
  } catch (error) {
    console.log('\n❌ Server is not running!');
    console.log('Please start the server first: npm run dev');
    return;
  }
  
  // Process all images
  const results = {
    total: allImages.length,
    success: 0,
    failed: 0,
    skipped: 0
  };
  
  for (let i = 0; i < allImages.length; i++) {
    const result = await processImage(allImages[i], i, allImages.length);
    
    if (result.success) {
      results.success++;
    } else if (result.reason === 'No text found') {
      results.skipped++;
    } else {
      results.failed++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Final summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Processing Complete!');
  console.log(`  Total images: ${results.total}`);
  console.log(`  ✅ Successfully processed: ${results.success}`);
  console.log(`  ⚠️  Skipped (no text): ${results.skipped}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  console.log('\n✨ Training data saved to: training_data.csv');
}

main().catch(console.error);
