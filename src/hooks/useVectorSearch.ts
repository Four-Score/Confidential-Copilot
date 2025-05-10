import { useState, useCallback } from 'react';
import { 
  generateQueryEmbedding,
  encryptQueryEmbedding,
  executeVectorSearch,
  decryptSearchResults,
  processSearchResults
} from '@/lib/searchUtils';
import { 
  SearchConfig, 
  DEFAULT_SEARCH_CONFIG,
  VectorSearchResult,
  ProcessedSearchResult,
  ChunkSearchResult
} from '@/types/search';

interface VectorSearchHookResult {
  search: (query: string, projectId: string, documentIds?: string[]) => Promise<ProcessedSearchResult>;
  isLoading: boolean;
  error: Error | null;
  results: ProcessedSearchResult | null;
  rawResults: VectorSearchResult | null;
  decryptBatch: (results: ChunkSearchResult[]) => Promise<ChunkSearchResult[]>;
  resetSearch: () => void;
  searchConfig: SearchConfig;
  updateSearchConfig: (newConfig: Partial<SearchConfig>) => void;
}

/**
 * Custom hook for vector search functionality
 * @param initialConfig Optional initial search configuration
 * @returns Hook object with search function, states, and utilities
 */
export function useVectorSearch(
  initialConfig?: Partial<SearchConfig>
): VectorSearchHookResult {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [results, setResults] = useState<ProcessedSearchResult | null>(null);
  const [rawResults, setRawResults] = useState<VectorSearchResult | null>(null);
  const [searchConfig, setSearchConfig] = useState<SearchConfig>({
    ...DEFAULT_SEARCH_CONFIG,
    ...initialConfig
  });

  const updateSearchConfig = useCallback((newConfig: Partial<SearchConfig>) => {
    setSearchConfig(prevConfig => ({
      ...prevConfig,
      ...newConfig
    }));
  }, []);

  const resetSearch = useCallback(() => {
    setResults(null);
    setRawResults(null);
    setError(null);
  }, []);

  const decryptBatch = useCallback(async (results: ChunkSearchResult[]): Promise<ChunkSearchResult[]> => {
    try {
      return await decryptSearchResults(results, searchConfig.batchSize);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to decrypt results');
      setError(error);
      throw error;
    }
  }, [searchConfig.batchSize]);

  const search = useCallback(async (
    query: string,
    projectId: string,
    documentIds?: string[]
  ): Promise<ProcessedSearchResult> => {
    resetSearch();
    setIsLoading(true);
  
    try {
      // Step 1: Generate embedding for query
      const embedding = await generateQueryEmbedding(query);
      
      // Step 2: Encrypt the embedding
      const encryptedEmbedding = await encryptQueryEmbedding(embedding);
      
      // Step 3: Execute vector search
      const searchResult = await executeVectorSearch(
        query, 
        encryptedEmbedding, 
        projectId, 
        documentIds, 
        searchConfig
      );
      
      setRawResults(searchResult);
      
      // Step 4: Decrypt encrypted results if any
      let combinedResults = [...searchResult.combinedResults];
      
      // Only attempt decryption if there are encrypted results
      const encryptedResults = combinedResults.filter(result => result.encryptedContent);
      
      if (encryptedResults.length > 0) {
        const decryptedResults = await decryptBatch(encryptedResults);
        
        // Replace encrypted results with their decrypted versions
        combinedResults = combinedResults.map(result => {
          const decrypted = decryptedResults.find(dr => dr.chunkId === result.chunkId);
          return decrypted || result;
        });
      }
      
      // Step 5: Process and group results
      const processedResults = processSearchResults(combinedResults, query);
      
      setResults(processedResults);
      setIsLoading(false);
      
      return processedResults;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Search failed');
      setError(error);
      setIsLoading(false);
      throw error;
    }
  }, [decryptBatch, resetSearch, searchConfig]);

  return {
    search,
    isLoading,
    error,
    results,
    rawResults,
    decryptBatch,
    resetSearch,
    searchConfig,
    updateSearchConfig
  };
}