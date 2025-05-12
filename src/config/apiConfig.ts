export const API_CONFIG = {
  groq: {
    // Default models
    models: {
      llama: 'llama-3.3-70b-versatile',
      deepseek: 'deepseek-r1-distill-llama-70b',
      maverick: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    },
    // Map friendly names to model IDs
    modelNames: {
      'Llama 3.3 70B': 'llama-3.3-70b-versatile',
      'Deepseek R1': 'deepseek-r1-distill-llama-70b',
      'Llama 4 Maverick': 'meta-llama/llama-4-maverick-17b-128e-instruct',
    }
  }
};

// Helper to get the available models for use in UI components
export function getAvailableModels() {
  return Object.entries(API_CONFIG.groq.modelNames).map(([name, id]) => ({
    id,
    name
  }));
}