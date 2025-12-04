/**
 * AI Explainer Service
 * Use OpenAI to translate technical analysis into human-readable insights
 */
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate human-readable analysis report from all collected data
 * @param {Object} allData - All analysis data including ML, URL, phone, AI results
 * @returns {Object} Formatted response for frontend
 */
export async function generateExplainedReport(allData) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API Key not configured, using fallback');
      return generateFallbackReport(allData);
    }

    const {
      messageText,
      parsed,
      mlResult,
      urlResult,
      phoneResult,
      aiResult,
      topScamFactors,
    } = allData;

    // Determine primary risk score (ML > rule-based)
    const primaryScore = mlResult?.available ? Math.round(mlResult.scamProbability * 100) : calculateRuleBasedScore(allData);

    const prompt = `You are an expert in explaining cybersecurity analysis results to everyday users. I will provide you with technical scam detection data, and you must translate it into clear, actionable insights.

**Message being analyzed:**
"${messageText}"

**Analysis Data:**

1. **ML Model Prediction** ${mlResult?.available ? '(PRIMARY SOURCE)' : '(NOT AVAILABLE)'}:
${mlResult?.available ? `
   - Scam Probability: ${(mlResult.scamProbability * 100).toFixed(1)}%
   - Confidence: ${mlResult.confidence}
   - Top Contributing Factors:
${topScamFactors?.map((f, i) => `     ${i + 1}. ${f.feature}: value=${f.value.toFixed(2)}, importance=${(f.importance * 100).toFixed(1)}%`).join('\n') || '     (none)'}
` : '   - Model unavailable, using rule-based analysis'}

2. **URL Analysis:**
${urlResult ? `
   - Safe: ${urlResult.isSafe ? 'Yes' : 'No'}
   - URL: ${parsed.url || '(none detected)'}
${!urlResult.isSafe ? `   - Threat Type: ${urlResult.threatType}` : ''}
` : '   - No URL detected'}

3. **Phone Number Analysis:**
${phoneResult ? `
   - Valid: ${phoneResult.valid ? 'Yes' : 'No'}
   - Type: ${phoneResult.lineType || 'Unknown'}
   - Carrier: ${phoneResult.carrier || 'Unknown'}
   - Phone: ${parsed.phone || '(none detected)'}
` : '   - No phone number detected'}

4. **AI Content Analysis:**
   - Is Scam: ${aiResult?.isScam ? 'Yes' : 'No'}
   - Confidence: ${aiResult?.confidence || 0}%
   - Reason: ${aiResult?.reason || 'N/A'}
   - Keywords: ${aiResult?.keywords?.join(', ') || 'None'}
   - Urgency Level: ${aiResult?.urgency_level || 0}/10
   - Threat Level: ${aiResult?.threat_level || 0}/10
   - Temptation Level: ${aiResult?.temptation_level || 0}/10
   - Impersonation: ${aiResult?.impersonation_type || 'None'}
   - Action Requested: ${aiResult?.action_requested || 'None'}

**Your Task:**
Based on this analysis, generate a report in the following JSON format:

\`\`\`json
{
  "riskLevel": "red|yellow|green",
  "riskScore": 0-100,
  "evidence": [
    "Clear explanation 1 (e.g., 'The ML model detected strong scam patterns')",
    "Clear explanation 2 (e.g., 'The message uses urgent language to pressure you into clicking immediately')",
    "Clear explanation 3...",
    "(up to 5-8 key points)"
  ],
  "action": {
    "title": "Appropriate title based on risk",
    "suggestions": [
      "Actionable suggestion 1",
      "Actionable suggestion 2",
      "(3-5 suggestions)"
    ]
  }
}
\`\`\`

**Guidelines:**
1. **riskScore**: Use ML score (${primaryScore}) as primary. Adjust ±5 if other factors strongly disagree.
2. **riskLevel**: 
   - "red" if score ≥ 75 or extremely high-confidence scam indicators
   - "yellow" if 30-74 or mixed signals
   - "green" if < 30 and mostly safe
3. **evidence**: 
   - Translate technical features into plain language
   - Explain WHY each factor matters
   - For ML factors like "url_is_shortened", explain: "The link uses a URL shortener (like bit.ly), which is commonly used by scammers to hide the real destination"
   - Prioritize the most important findings
   - Use emojis sparingly (one per point max): 🚨⚠️✅🔗📱💰⏰
4. **action.suggestions**:
   - Concrete, actionable steps
   - Match severity to risk level
   - Include reporting options for high-risk cases

Respond ONLY with valid JSON. No markdown, no explanations outside the JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at explaining technical cybersecurity analysis to everyday users. Translate jargon into clear, actionable insights. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
    // Ensure score matches ML if available
    if (mlResult?.available) {
      result.riskScore = primaryScore;
      // Also ensure riskLevel matches the score thresholds
      if (primaryScore >= 75) {
        result.riskLevel = 'red';
      } else if (primaryScore >= 30) {
        result.riskLevel = 'yellow';
      } else {
        result.riskLevel = 'green';
      }
    }

    return result;

  } catch (error) {
    console.error('❌ AI Explainer error:', error.message);
    return generateFallbackReport(allData);
  }
}

/**
 * Fallback report generation when OpenAI is unavailable
 */
function generateFallbackReport(allData) {
  const { mlResult, urlResult, phoneResult, aiResult } = allData;
  
  const evidence = [];
  let riskScore = 0;

  // Use ML score if available
  if (mlResult?.available) {
    const mlScore = Math.round(mlResult.scamProbability * 100);
    riskScore = mlScore;
    evidence.push(`🤖 ML Model: ${mlScore}% scam probability (${mlResult.confidence} confidence)`);
  }

  // URL analysis
  if (urlResult && !urlResult.isSafe) {
    evidence.push(`⚠️ URL flagged as dangerous: ${urlResult.threatType}`);
    riskScore += mlResult?.available ? 0 : 40;
  } else if (urlResult && urlResult.isSafe) {
    evidence.push('✅ URL appears safe');
  }

  // Phone analysis
  if (phoneResult?.lineType === 'voip') {
    evidence.push('⚠️ Phone number is VoIP (commonly used in scams)');
    riskScore += mlResult?.available ? 0 : 30;
  } else if (phoneResult?.valid) {
    evidence.push(`✅ Phone number is valid (${phoneResult.carrier})`);
  }

  // AI analysis
  if (aiResult?.isScam) {
    evidence.push(`🔍 AI detected scam indicators: ${aiResult.reason}`);
    riskScore += mlResult?.available ? 0 : aiResult.confidence * 0.3;
  }

  // Determine risk level
  let riskLevel = 'green';
  if (riskScore >= 75) riskLevel = 'red';
  else if (riskScore >= 30) riskLevel = 'yellow';

  // Generate action suggestions
  const action = {
    title: riskLevel === 'red' ? '🚨 High Risk Warning' : 
           riskLevel === 'yellow' ? '⚠️ Handle with Caution' : 
           '✅ Appears Safe',
    suggestions: riskLevel === 'red' ? [
      'Do not click any links in this message',
      'Do not call back or respond',
      'Block this sender immediately',
      'Report to 165 anti-fraud hotline if financial loss involved'
    ] : riskLevel === 'yellow' ? [
      'Verify through official channels before taking action',
      'Do not provide personal or financial information',
      'Be cautious with any links or phone numbers',
      'Contact 165 if you have doubts'
    ] : [
      'No obvious scam indicators detected',
      'However, always remain vigilant',
      'Never share sensitive information unless verified'
    ]
  };

  return {
    riskLevel,
    riskScore: Math.min(Math.round(riskScore), 99),
    evidence: evidence.length > 0 ? evidence : ['Analysis completed with limited data'],
    action
  };
}

/**
 * Calculate rule-based score when ML is unavailable
 */
function calculateRuleBasedScore(allData) {
  const { urlResult, phoneResult, aiResult } = allData;
  let score = 0;

  if (urlResult && !urlResult.isSafe) score += 40;
  if (phoneResult?.lineType === 'voip') score += 30;
  if (aiResult?.isScam) score += aiResult.confidence * 0.99;

  return Math.min(Math.round(score), 99);
}
