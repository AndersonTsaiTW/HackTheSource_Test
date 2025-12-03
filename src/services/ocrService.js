import Tesseract from 'tesseract.js';

/**
 * Extract text from an image using Tesseract.js OCR
 * @param {Buffer} imageBuffer - Image file buffer
 * @returns {Promise<string>} Extracted text from image
 */
export async function extractTextFromImage(imageBuffer) {
  try {
    console.log('🔍 Starting OCR processing...');
    
    // Convert buffer to base64 for Tesseract
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;
    
    // Initialize Tesseract worker
    const worker = await Tesseract.createWorker();
    
    try {
      // Recognize text from image
      const { data: { text } } = await worker.recognize(dataUrl);
      
      console.log('✅ OCR completed successfully');
      console.log('📄 Extracted text length:', text.length);
      
      return text;
    } finally {
      // Always terminate worker
      await worker.terminate();
    }
  } catch (error) {
    console.error('❌ OCR error:', error);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}
