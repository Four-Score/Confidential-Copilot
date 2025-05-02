/**
 * Helper utilities for the email assistant extension
 */

/**
 * Generates a unique ID
 */
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Formats bytes to a human-readable string
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Truncates text to a specific length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Extracts the domain from an email address
 */
export const getEmailDomain = (email: string): string | null => {
  const match = email.match(/@([^@]+)$/);
  return match ? match[1] : null;
};

/**
 * Sanitizes HTML to prevent XSS (for when inserting content into Gmail)
 */
export const sanitizeHtml = (html: string): string => {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
};

/**
 * Debounces a function to limit how often it can be called
 */
export const debounce = <F extends (...args: any[]) => any>(
  func: F, 
  waitFor: number
): ((...args: Parameters<F>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<F>): void => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
};

/**
 * Detects if the current browser environment is Gmail
 */
export const isGmailEnvironment = (): boolean => {
  return window.location.href.includes('mail.google.com');
};

/**
 * Safely parses JSON with error handling
 */
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
};