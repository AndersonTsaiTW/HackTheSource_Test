import axios from 'axios';
import config from '../config.js';

/**
 * Check URL safety using Google Safe Browsing Lookup API v4
 */
export async function checkUrlSafety(url) {
  if (!url) return null;

  try {
    const apiKey = config.googleSafeBrowsingApiKey;
    
    if (!apiKey) {
      console.warn('⚠️ Google Safe Browsing API Key not configured');
      return { isSafe: true, threatType: null, error: 'API Key not configured' };
    }

    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
    
    const requestBody = {
      client: {
        clientId: "hackthesource",
        clientVersion: "1.0.0"
      },
      threatInfo: {
        threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url }]
      }
    };

    const response = await axios.post(endpoint, requestBody);
    
    if (response.data.matches && response.data.matches.length > 0) {
      return {
        isSafe: false,
        threatType: response.data.matches[0].threatType,
        platform: response.data.matches[0].platformType,
      };
    }

    return { isSafe: true, threatType: null };
  } catch (error) {
    console.error('❌ Safe Browsing API error:', error.message);
    return { isSafe: true, threatType: null, error: error.message };
  }
}
