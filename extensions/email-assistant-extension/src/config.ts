export const config = {
  apiUrl: 'http://localhost:3000/api',

  features: {
    encryptionEnabled: false,
    useLocalStorageOnly: true,
    sendAnalytics: false,
  },

  limits: {
    maxAttachmentSize: 25 * 1024 * 1024,
    maxEmailsStored: 100,
  },

  responseDefaults: {
    tone: 'neutral' as const,
    length: 'standard' as const,
    includeAttachmentReferences: true,
  },

  env: {
    GROQ_API_KEY: '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',
  },
};

export default config;
