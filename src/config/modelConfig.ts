import { ChatModel, ChatSettings, LLMProvider } from '@/types/chat';

// Define available models
export const defaultModels: ChatModel[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    provider: LLMProvider.GROQ,
    description: 'Meta\'s advanced 70B LLM, versatile for various tasks',
    contextWindow: 8192,
    inputCostPer1kTokens: 0.0007,
    outputCostPer1kTokens: 0.0007
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 Distill Llama 70B',
    provider: LLMProvider.GROQ,
    description: 'DeepSeek\'s distilled 70B model focused on reasoning',
    contextWindow: 8192,
    inputCostPer1kTokens: 0.0007,
    outputCostPer1kTokens: 0.0007
  },
  {
    id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    name: 'Llama 4 Maverick 17B',
    provider: LLMProvider.GROQ,
    description: 'Meta\'s compact 17B model with effective instruct capabilities',
    contextWindow: 128000, // Extended context window
    inputCostPer1kTokens: 0.0002,
    outputCostPer1kTokens: 0.0002
  }
];

// Default settings for each model
export const getDefaultSettings = (modelId: string): ChatSettings => {
  const baseSettings: ChatSettings = {
    temperature: 0.7,
    maxTokens: 4000,
    topP: 0.95,
    presencePenalty: 0,
    frequencyPenalty: 0,
    similarityThreshold: 0.75,
    maxChunks: 10,
    showContextCards: true
  };
  
  // Model-specific overrides
  switch (modelId) {
    case 'llama-3.3-70b-versatile':
      return {
        ...baseSettings,
        temperature: 0.7,
        maxTokens: 4000
      };
    case 'deepseek-r1-distill-llama-70b':
      return {
        ...baseSettings,
        temperature: 0.5, // Lower temperature for more focused responses
        maxTokens: 4000
      };
    case 'meta-llama/llama-4-maverick-17b-128e-instruct':
      return {
        ...baseSettings,
        temperature: 0.7,
        maxTokens: 8000, // Higher token limit for larger context window
        maxChunks: 20 // Can handle more chunks due to larger context window
      };
    default:
      return baseSettings;
  }
};

// Validate settings for a specific model
export const validateSettings = (settings: ChatSettings, modelId: string): [boolean, string?] => {
  // Basic validation rules
  if (settings.temperature < 0 || settings.temperature > 1) {
    return [false, "Temperature must be between 0 and 1"];
  }
  
  // Get the model
  const model = defaultModels.find(m => m.id === modelId);
  if (!model) {
    return [false, "Invalid model ID"];
  }
  
  // Validate max tokens (should not exceed context window)
  const maxAllowedTokens = model.contextWindow - 500; // Leave some room for the prompt
  if (settings.maxTokens > maxAllowedTokens) {
    return [false, `Max tokens cannot exceed ${maxAllowedTokens} for this model`];
  }
  
  return [true];
};

// Get model by ID
export const getModelById = (modelId: string): ChatModel | undefined => {
  return defaultModels.find(model => model.id === modelId);
};