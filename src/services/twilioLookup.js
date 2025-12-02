import axios from 'axios';
import config from '../config.js';

/**
 * Lookup phone information using Twilio Lookup v2 API
 */
export async function lookupPhone(phone) {
  if (!phone) return null;

  try {
    const { accountSid, authToken } = config.twilio;
    
    if (!accountSid || !authToken) {
      console.warn('⚠️ Twilio credentials not configured');
      return { valid: true, carrier: null, error: 'Twilio credentials not configured' };
    }

    // Format phone number (add country code if needed)
    const formattedPhone = phone.startsWith('+') ? phone : `+886${phone.substring(1)}`;
    
    const url = `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(formattedPhone)}?Fields=line_type_intelligence`;
    
    const response = await axios.get(url, {
      auth: {
        username: accountSid,
        password: authToken,
      },
    });

    return {
      valid: response.data.valid,
      phoneNumber: response.data.phone_number,
      countryCode: response.data.country_code,
      carrier: response.data.carrier?.name || null,
      lineType: response.data.line_type_intelligence?.type || null, // mobile, landline, voip
    };
  } catch (error) {
    console.error('❌ Twilio Lookup API error:', error.message);
    return { valid: false, carrier: null, error: error.message };
  }
}
