import { Document, UnencryptedDocument } from './document';

// Type for representing similarity scores (0-1 range)
export type SimilarityScore = number;

// Configuration options for vector search
export interface SearchConfig {
  matchThreshold: number;  // Minimum similarity score (default: 0.7)
  matchCount: number;      // Maximum number of results to return (default: 5)
  batchSize: number;       // Size of decryption batches (default: 10)
}

// Default search configuration values
export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  matchThreshold: 0.3,
  matchCount: 5,
  batchSize: 10
};

// Request payload for vector search API
export interface VectorSearchRequest {
  query: string;               // Original query text
  queryEmbedding: number[];    // Encrypted embedding of the query
  projectId: string;           // Project ID to search within
  documentIds?: string[];      // Optional: specific document IDs to search
  config?: Partial<SearchConfig>; // Optional: search configuration overrides
}

// Individual chunk result from vector search
export interface ChunkSearchResult {
  chunkId: string;
  documentId: string;
  documentName: string;
  documentType: string;
  chunkNumber: number;
  content: string;         // For unencrypted chunks (v2_vector_chunks)
  encryptedContent?: string; // For encrypted chunks (vector_chunks)
  metadata: any;
  encryptedMetadata?: any;
  similarity: SimilarityScore;
  isDecrypted?: boolean;
}

// Response structure from vector search API
export interface VectorSearchResult {
  encryptedResults: ChunkSearchResult[];
  unencryptedResults: ChunkSearchResult[];
  combinedResults: ChunkSearchResult[];
  query: string;
  totalResults: number;
  searchConfig: SearchConfig;
}

// Grouped search results for display (by document)
export interface GroupedSearchResult {
  documentId: string;
  documentName: string;
  documentType: string;
  isEncrypted: boolean;
  chunks: ChunkSearchResult[];
  maxSimilarity: SimilarityScore;
}

// Processed search result for display
export interface ProcessedSearchResult {
  groupedResults: GroupedSearchResult[];
  totalChunks: number;
  originalQuery: string;
}