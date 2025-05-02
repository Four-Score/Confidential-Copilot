import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '../../.env.local' });

export const config = {
  // API endpoints (will be updated during integration)
  apiUrl: 'http://localhost:3000/api',

  // Feature flags
  features: {
    encryptionEnabled: false,
    useLocalStorageOnly: true,
    sendAnalytics: false,
  },

  // Limits and constraints
  limits: {
    maxAttachmentSize: 25 * 1024 * 1024, // 25MB in bytes
    maxEmailsStored: 100, // Maximum emails to store locally
  },

  // Default options for response generation
  responseDefaults: {
    tone: 'neutral' as const,
    length: 'standard' as const,
    includeAttachmentReferences: true,
  },

  // Environment variables
  env: {
    GROQ_API_KEY: process.env.GROQ_API_KEY || '', // Load GROQ API Key
  },
};

export default config;