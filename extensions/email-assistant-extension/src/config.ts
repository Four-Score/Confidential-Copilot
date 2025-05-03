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
