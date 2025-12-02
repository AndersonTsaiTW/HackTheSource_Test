import express from 'express';
import { parseMessage } from '../services/parser.js';
import { checkUrlSafety } from '../services/safeBrowsing.js';
import { lookupPhone } from '../services/twilioLookup.js';
import { analyzeWithOpenAI } from '../services/openaiCheck.js';
import { generateResponse } from '../utils/analyzer.js';

const router = express.Router();

router.post('/analyze', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // 1. Parse message to extract URL, phone, and content
    const parsed = parseMessage(message);
    console.log('📝 Parsed result:', parsed);

    // 2. Call three APIs in parallel
    const [urlResult, phoneResult, aiResult] = await Promise.all([
      parsed.url ? checkUrlSafety(parsed.url) : Promise.resolve(null),
      parsed.phone ? lookupPhone(parsed.phone) : Promise.resolve(null),
      analyzeWithOpenAI(parsed.content),
    ]);

    // 3. Generate comprehensive response
    const response = generateResponse({
      parsed,
      urlResult,
      phoneResult,
      aiResult,
    });

    res.json(response);
  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message 
    });
  }
});

export default router;
