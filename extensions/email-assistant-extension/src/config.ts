// Configuration settings for the extension
// These can be updated when integrating with the Next.js application

export const config = {
  // API endpoints (will be updated during integration)
  apiUrl: 'http://localhost:3000/api',
  
  // Feature flags
  features: {
    encryptionEnabled: false,
    useLocalStorageOnly: true,
    sendAnalytics: false
  },
  
  // Limits and constraints
  limits: {
    maxAttachmentSize: 25 * 1024 * 1024, // 25MB in bytes
    maxEmailsStored: 100 // Maximum emails to store locally
  },
  
  // Default options for response generation
  responseDefaults: {
    tone: 'neutral' as const,
    length: 'standard' as const,
    includeAttachmentReferences: true
  }
};

export default config;