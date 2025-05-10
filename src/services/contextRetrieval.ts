import { 
  generateQueryEmbedding, 
  encryptQueryEmbedding, 
  executeVectorSearch, 
  decryptSearchResultsOptimized,
  processSearchResults
} from '@/lib/searchUtils';
import { RetrievedChunk, RetrievedDocument, RetrievedContext } from '@/types/chat';
import { SearchConfig } from '@/types/search';
import { ChunkSearchResult, ProcessedSearchResult } from '@/types/search';

/**
 * Default search configuration for context retrieval
 */
export const DEFAULT_CONTEXT_SEARCH_CONFIG: SearchConfig = {
  matchThreshold: 0.75, // Higher threshold for more relevant results
  matchCount: 10,       // Limit to top 10 results by default
  batchSize: 5          // Smaller batch size for quicker initial results
};

/**
 * Options for context retrieval
 */
export interface ContextRetrievalOptions {
  maxChunks?: number;           // Maximum chunks to include in context
  similarityThreshold?: number; // Minimum similarity score for chunks
  searchConfig?: Partial<SearchConfig>; // Override default search config
}

/**
 * Retrieve context for a query from selected documents
 * @param query The query to retrieve context for
 * @param projectIds The projects to search in
 * @param documentIds The documents to search in
 * @param options Optional retrieval configuration
 * @returns Retrieved context with chunks and documents
 */
export async function retrieveContext(
  query: string,
  projectIds: string[],
  documentIds: string[],
  options: ContextRetrievalOptions = {}
): Promise<RetrievedContext> {
  if (!query.trim()) {
    throw new Error('Query cannot be empty');
  }
  
  if (!documentIds.length) {
    throw new Error('No documents specified for context retrieval');
  }

  // Use the first project as the main one for search
  // (API currently only supports searching one project at a time)
  const projectId = projectIds[0];

  // Merge options with defaults
  const {
    maxChunks = 10,
    similarityThreshold = 0.75,
  } = options;
  
  // Create search configuration
  const searchConfig: SearchConfig = {
    ...DEFAULT_CONTEXT_SEARCH_CONFIG,
    ...options.searchConfig,
    matchThreshold: similarityThreshold,
    matchCount: maxChunks * 2 // Request more than needed to filter by threshold
  };

  try {
    // Generate and encrypt query embedding
    const embedding = await generateQueryEmbedding(query);
    const encryptedEmbedding = await encryptQueryEmbedding(embedding);
    
    // Execute vector search
    const searchResult = await executeVectorSearch(
      query, 
      encryptedEmbedding, 
      projectId, 
      documentIds, 
      searchConfig
    );
    
    // Decrypt results if needed
    const combinedResults = [...searchResult.combinedResults];
    const encryptedResults = combinedResults.filter(result => result.encryptedContent);
    
    if (encryptedResults.length > 0) {
      const decryptedResults = await decryptSearchResultsOptimized(encryptedResults, searchConfig.batchSize);
      
      // Replace encrypted results with their decrypted versions
      for (let i = 0; i < combinedResults.length; i++) {
        const result = combinedResults[i];
        if (result.encryptedContent) {
          const decrypted = decryptedResults.find(dr => dr.chunkId === result.chunkId);
          if (decrypted) {
            combinedResults[i] = decrypted;
          }
        }
      }
    }
    
    // Process and group results
    const processedResults = processSearchResults(combinedResults, query);
    
    // Convert to RetrievedContext format
    const context = formatSearchResultsAsContext(processedResults, maxChunks, similarityThreshold);
    
    return context;
  } catch (error) {
    console.error('Context retrieval error:', error);
    throw new Error('Failed to retrieve context');
  }
}

/**
 * Format search results as RetrievedContext for LLM consumption
 * @param results Processed search results
 * @param maxChunks Maximum chunks to include
 * @param similarityThreshold Minimum similarity score
 * @returns Formatted context
 */
export function formatSearchResultsAsContext(
  results: ProcessedSearchResult,
  maxChunks: number,
  similarityThreshold: number
): RetrievedContext {
  // Map grouped results to RetrievedDocument format  
  const documents = results.groupedResults.map((group) => {
    // Determine document type (ensure it matches the allowed types in RetrievedDocument)
    const docType = (group.documentType === 'pdf' || 
                     group.documentType === 'website' || 
                     group.documentType === 'youtube') 
                     ? (group.documentType as 'pdf' | 'website' | 'youtube') : 'website';
                     
    // Filter chunks by similarity threshold and limit count
    const chunks: RetrievedChunk[] = group.chunks
      .filter((chunk) => chunk.similarity >= similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxChunks)
      .map((chunk) => ({
        id: chunk.chunkId,
        documentId: chunk.documentId,
        content: chunk.content,
        metadata: chunk.metadata || {},
        chunkNumber: chunk.chunkNumber || 0,
        similarityScore: chunk.similarity
      }));
    
    return {
      id: group.documentId,
      name: group.documentName,
      type: docType,
      projectId: group.documentId.split('-')[0] || group.documentId, // Use first part of ID as project ID or full ID
      chunks: chunks
    } as RetrievedDocument;
  })
  // Filter out documents with no chunks that meet the threshold
  .filter((doc) => doc.chunks.length > 0);  
  // Count total chunks
  const totalChunks = documents.reduce((total, doc) => total + doc.chunks.length, 0);
  
  // Return the properly formatted context
  return {
    query: results.originalQuery,
    documents: documents,
    totalChunks: totalChunks
  };
}

/**
 * Convert a ChunkSearchResult to a RetrievedChunk format
 * @param chunk The search result chunk to convert
 * @returns Converted chunk in RetrievedChunk format
 */
export function convertToRetrievedChunk(chunk: ChunkSearchResult): RetrievedChunk {
  return {
    id: chunk.chunkId,
    documentId: chunk.documentId,
    content: chunk.content,
    metadata: chunk.metadata || {},
    chunkNumber: chunk.chunkNumber || 0,
    similarityScore: chunk.similarity
  };
}