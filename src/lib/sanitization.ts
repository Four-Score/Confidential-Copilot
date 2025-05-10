import DOMPurify from 'dompurify';

/**
 * Sanitize user input to prevent XSS attacks and other injection
 * @param input The input to sanitize (string, object, or array)
 * @returns Sanitized version of the input
 */
export function sanitizeInput(input: any): any {
  if (input === null || input === undefined) {
    return input;
  }
  
  // For strings, use DOMPurify
  if (typeof input === 'string') {
    // Use DOMPurify for HTML sanitization
    return DOMPurify.sanitize(input);
  }
  
  // For arrays, sanitize each element
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }
  
  // For objects, sanitize each property
  if (typeof input === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  // For other types (numbers, booleans), return as is
  return input;
}