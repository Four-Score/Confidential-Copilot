/**
 * Enum for different LLM providers
 * This allows for easy extension to additional providers in the future
 */
export enum LLMProvider {
  GROQ = 'groq',
  // Additional providers can be added in future:
  // OPENAI = 'openai',
  // ANTHROPIC = 'anthropic',
  // etc.
}

/**
 * Interface for chat model configuration
 */
export interface ChatModel {
  id: string;           // Unique identifier for the model
  name: string;         // Display name for the model
  provider: LLMProvider; // Which provider this model belongs to
  description?: string; // Optional description of the model capabilities
  contextWindow: number; // Maximum context window size in tokens
  inputCostPer1kTokens?: number; // Optional cost information
  outputCostPer1kTokens?: number; // Optional cost information
}

/**
 * Interface for chat settings
 */
export interface ChatSettings {
  temperature: number;   // Controls randomness (0.0 to 1.0)
  maxTokens: number;     // Maximum number of tokens to generate
  topP?: number;         // Alternative to temperature, nucleus sampling
  presencePenalty?: number; // Penalize new tokens based on presence in text so far
  frequencyPenalty?: number; // Penalize new tokens based on frequency in text so far
  similarityThreshold?: number; // Threshold for vector search similarity (0.0 to 1.0)
  maxChunks?: number;    // Maximum number of chunks to include in context
  showContextCards: boolean; // Whether to show context cards with responses
}

/**
 * Interface for a chat message
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

/**
 * Interface for chat state
 */
export interface ChatState {
  id: string;
  name?: string;
  messages: ChatMessage[];
  selectedDocumentIds: string[];
  selectedProjectIds: string[];
  modelId: string;
  settings: ChatSettings;
  createdAt: number;
  lastUpdatedAt: number;
}


/**
 * Interface for a retrieved document chunk used in context
 */
export interface RetrievedChunk {
  id: string;
  documentId: string;
  chunkNumber: number;
  content: string;
  similarityScore: number;
  metadata: Record<string, any>;
}

/**
 * Interface for a retrieved document with its chunks
 */
export interface RetrievedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'website' | 'youtube'; // Document types
  projectId: string;
  chunks: RetrievedChunk[];
}

/**
 * Interface for complete context retrieved for a query
 */
export interface RetrievedContext {
  query: string;
  documents: RetrievedDocument[];
  totalChunks: number;
}