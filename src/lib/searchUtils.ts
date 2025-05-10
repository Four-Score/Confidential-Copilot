import { createEmbeddingModel, normalizeVector } from './embeddingUtils';
import { KeyManagementService } from '@/services/keyManagement/KeyManagementService';
import { ChunkSearchResult, GroupedSearchResult, ProcessedSearchResult, SearchConfig, VectorSearchRequest, VectorSearchResult } from '@/types/search';
import { DocumentSearchResult, DocumentWithSimilarity, UnencryptedDocumentWithSimilarity } from '@/types/document';

// Cache the embedding model instance
let embeddingModelInstance: any = null;

/**
 * Generates an embedding vector for a query text
 * @param queryText The text to generate an embedding for
 * @returns Promise resolving to a vector embedding
 */
export async function generateQueryEmbedding(queryText: string): Promise<number[]> {
  
  if (!queryText.trim()) {
    throw new Error('Query text cannot be empty');
  }

  // Initialize the embedding model if not already done
  if (!embeddingModelInstance) {
    try {
      embeddingModelInstance = await createEmbeddingModel();
    } catch (error) {
      throw new Error('Failed to initialize embedding model');
    }
  }

  try {
    // Generate the embedding for the query text
    // Try embedQuery first (this is likely the correct method name)
    let embedding;
    if (typeof embeddingModelInstance.embedQuery === 'function') {
      embedding = await embeddingModelInstance.embedQuery(queryText);
    } else if (typeof embeddingModelInstance.embed === 'function') {
      embedding = await embeddingModelInstance.embed(queryText);
    } else {
      throw new Error('Embedding model does not have a valid embedding method');
    }
        
    // Normalize the embedding vector (important for cosine similarity)
    const normalizedEmbedding = normalizeVector(Array.from(embedding));
    
    return normalizedEmbedding;
  } catch (error) {
    throw new Error('Failed to generate embedding for query');
  }
}


/**
 * Encrypts a query embedding vector using the Key Management Service
 * @param embedding The vector embedding to encrypt
 * @returns Promise resolving to an encrypted vector
 */
export async function encryptQueryEmbedding(embedding: number[]): Promise<number[]> {
  try {
    // Get the Key Management Service instance
    const kms = KeyManagementService.getInstance();
    
    if (!kms) {
      throw new Error('Key Management Service is not initialized');
    }
    
    // Encrypt the embedding vector using the same method used during ingestion
    const encryptedEmbedding = await kms.encryptVector(embedding);
    
    return encryptedEmbedding;
  } catch (error) {
    console.error('Error encrypting query embedding:', error);
    throw new Error('Failed to encrypt query embedding');
  }
}

/**
 * Executes a vector search against the API
 * @param query The original query text
 * @param queryEmbedding The encrypted query embedding
 * @param projectId The project ID to search within
 * @param documentIds Optional document IDs to limit the search to
 * @param config Optional search configuration parameters
 * @returns Promise resolving to search results
 */
export async function executeVectorSearch(
  query: string,
  queryEmbedding: number[],
  projectId: string,
  documentIds?: string[],
  config?: Partial<SearchConfig>
): Promise<VectorSearchResult> {
  
  try {
    const request: VectorSearchRequest = {
      query,
      queryEmbedding,
      projectId,
      documentIds,
      config
    };

    const response = await fetch('/api/search/vector', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Vector search failed');
    }

    const result = await response.json();
    
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Categorizes documents into encrypted and unencrypted types
 * @param documentIds Array of document IDs
 * @param documentTypes Map of document IDs to their types (encrypted/unencrypted)
 */
export function categorizeDocuments(documentIds: string[], documentTypes: Map<string, 'encrypted' | 'unencrypted'>) {
  const encryptedDocIds: string[] = [];
  const unencryptedDocIds: string[] = [];

  documentIds.forEach(id => {
    const type = documentTypes.get(id);
    if (type === 'encrypted') {
      encryptedDocIds.push(id);
    } else if (type === 'unencrypted') {
      unencryptedDocIds.push(id);
    }
  });

  return { encryptedDocIds, unencryptedDocIds };
}

/**
 * Batch decrypts encrypted search results
 * @param results Array of search results containing encrypted content
 * @param batchSize Size of decryption batches
 */
export async function decryptSearchResults(
  results: ChunkSearchResult[],
  batchSize: number = 10
): Promise<ChunkSearchResult[]> {
  
  // If no results to decrypt, return empty array
  if (!results.length) return [];

  const kms = KeyManagementService.getInstance();
  if (!kms) {
    throw new Error('Key Management Service is not initialized');
  } else {
  }
  
  // Process in batches to prevent UI freezing
  const decryptedResults: ChunkSearchResult[] = [];
  
  // Calculate how many batches we need
  const totalBatches = Math.ceil(results.length / batchSize);
  
  for (let i = 0; i < totalBatches; i++) {
    
    const batchStart = i * batchSize;
    const batchEnd = Math.min((i + 1) * batchSize, results.length);
    const batch = results.slice(batchStart, batchEnd);
    
    
    // Process each item in the current batch
    const batchPromises = batch.map(async (result) => {
      try {
        // Only decrypt if we have encrypted content
        if (result.encryptedContent) {
          const decryptedContent = await kms.decryptText(result.encryptedContent);
          
          // If there's encrypted metadata, decrypt that too
          let decryptedMetadata = result.metadata;
          if (result.encryptedMetadata) {
            decryptedMetadata = await kms.decryptMetadata(result.encryptedMetadata);
          }
          
          return {
            ...result,
            content: decryptedContent,
            metadata: decryptedMetadata,
            isDecrypted: true,
          };
        }
        return result;
      } catch (error) {
        // Return the original result if decryption fails
        return { 
          ...result, 
          content: 'Failed to decrypt content',
          isDecrypted: false,
          error: 'Decryption failed'
        };
      }
    });
    
    // Wait for all items in the current batch to be processed
    const decryptedBatch = await Promise.all(batchPromises);    
    decryptedResults.push(...decryptedBatch);
  }
  
  return decryptedResults;
}

export async function decryptSearchResultsOptimized(
  results: ChunkSearchResult[],
  batchSize: number = 10
): Promise<ChunkSearchResult[]> {
  // If no results to decrypt, return empty array
  if (!results.length) return [];

  const kms = KeyManagementService.getInstance();
  if (!kms) {
    throw new Error('Key Management Service is not initialized');
  }

  // Process in batches to prevent UI freezing
  const decryptedResults: ChunkSearchResult[] = [];
  
  // Calculate how many batches we need
  const totalBatches = Math.ceil(results.length / batchSize);
  
  for (let i = 0; i < totalBatches; i++) {
    const batchStart = i * batchSize;
    const batchEnd = Math.min((i + 1) * batchSize, results.length);
    const batch = results.slice(batchStart, batchEnd);
    
    // Extract encrypted content and metadata from the batch
    const encryptedContents = batch
      .filter(result => result.encryptedContent)
      .map(result => result.encryptedContent!);
    
    const encryptedMetadata = batch
      .filter(result => result.encryptedMetadata)
      .map(result => result.encryptedMetadata!);
    
    // Decrypt in batches
    let decryptedContents: string[] = [];
    let decryptedMetadataItems: any[] = [];
    
    try {
      if (encryptedContents.length) {
        decryptedContents = kms.decryptTextBatch(encryptedContents);
      }
      
      if (encryptedMetadata.length) {
        decryptedMetadataItems = kms.decryptMetadataBatch(encryptedMetadata);
      }
    } catch (error) {
      console.error('Batch decryption error:', error);
    }
    
    // Map decrypted content back to results
    const processedBatch = batch.map(result => {
      if (result.encryptedContent) {
        // Find the index of this item in the encryptedContents array
        const contentIndex = encryptedContents.indexOf(result.encryptedContent);
        const decryptedContent = contentIndex >= 0 ? decryptedContents[contentIndex] : 'Failed to decrypt';
        
        // Find the index of this item in the encryptedMetadata array
        let decryptedMetadata = result.metadata;
        if (result.encryptedMetadata) {
          const metadataIndex = encryptedMetadata.indexOf(result.encryptedMetadata);
          if (metadataIndex >= 0) {
            decryptedMetadata = decryptedMetadataItems[metadataIndex];
          }
        }
        
        return {
          ...result,
          content: decryptedContent,
          metadata: decryptedMetadata,
          isDecrypted: !!decryptedContent,
        };
      }
      return result;
    });
    
    decryptedResults.push(...processedBatch);
    
    // Allow UI to update between batches
    if (i < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return decryptedResults;
}

/**
 * Process search results by grouping them by document and sorting by relevance
 * @param results The search results to process
 * @param query The original query text
 */
export function processSearchResults(
  results: ChunkSearchResult[],
  query: string
): ProcessedSearchResult {
  // Group results by document ID
  const documentGroups: Map<string, GroupedSearchResult> = new Map();
  
  results.forEach(chunk => {
    if (!documentGroups.has(chunk.documentId)) {
      documentGroups.set(chunk.documentId, {
        documentId: chunk.documentId,
        documentName: chunk.documentName,
        documentType: chunk.documentType,
        isEncrypted: !!chunk.encryptedContent,
        chunks: [],
        maxSimilarity: chunk.similarity
      });
    }
    
    const group = documentGroups.get(chunk.documentId)!;
    group.chunks.push(chunk);
    
    // Keep track of the highest similarity score for this document
    if (chunk.similarity > group.maxSimilarity) {
      group.maxSimilarity = chunk.similarity;
    }
  });
  
  // Convert map to array and sort by max similarity
  const groupedResults = Array.from(documentGroups.values())
    .sort((a, b) => b.maxSimilarity - a.maxSimilarity);
    
  return {
    groupedResults,
    totalChunks: results.length,
    originalQuery: query
  };
}