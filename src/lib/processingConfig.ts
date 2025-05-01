/**
 * Configuration options for PDF processing pipeline
 */
export interface PDFProcessingConfig {
  /**
   * Maximum size of PDF file in bytes
   */
  maxFileSize: number;
  
  /**
   * Size of each text chunk in characters
   */
  chunkSize: number;
  
  /**
   * Overlap between consecutive chunks in characters
   */
  chunkOverlap: number;
  
  /**
   * How many chunks to process at once in embedding generation
   */
  embeddingBatchSize: number;
  
  /**
   * Whether to generate debug information in processing
   */
  debug: boolean;
}

/**
 * Default processing configuration
 */
export const DEFAULT_PROCESSING_CONFIG: PDFProcessingConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  chunkSize: 1000,
  chunkOverlap: 200,
  embeddingBatchSize: 10,
  debug: false
};

/**
 * Get processing configuration with user overrides
 */
export function getProcessingConfig(overrides?: Partial<PDFProcessingConfig>): PDFProcessingConfig {
  return {
    ...DEFAULT_PROCESSING_CONFIG,
    ...overrides
  };
}