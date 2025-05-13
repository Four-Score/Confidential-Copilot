
export const getGroqApiKey = (): string | undefined => {
  // First, try to get from environment variable
  if (typeof process !== 'undefined' && process.env.GROQ_API_KEY) {
    return process.env.GROQ_API_KEY;
  }
  
  // Then, try to get from localStorage if in browser
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem('groq_api_key') || undefined;
  }
  
  return undefined;
};

export const saveGroqApiKey = (apiKey: string): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('groq_api_key', apiKey);
  }
};