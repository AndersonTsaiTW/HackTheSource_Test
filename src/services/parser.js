/**
 * Extract URL, phone number, and content from message using Regex
 */
export function parseMessage(message) {
  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|net|org|tw|io|gov)[^\s]*)/gi;
  const urlMatch = message.match(urlRegex);
  
  // Phone regex pattern (Taiwan mobile, landline, international format)
  const phoneRegex = /(\+?886[-\s]?)?0?9\d{2}[-\s]?\d{3}[-\s]?\d{3}|(\+?886[-\s]?)?0\d[-\s]?\d{3,4}[-\s]?\d{4}/g;
  const phoneMatch = message.match(phoneRegex);
  
  return {
    url: urlMatch ? urlMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0].replace(/[-\s]/g, '') : null,
    content: message,
  };
}
