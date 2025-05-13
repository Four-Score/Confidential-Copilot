export const config = {
  apiUrl: 'https://confidential-copilot.onrender.com/api',

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
};

export default config;
