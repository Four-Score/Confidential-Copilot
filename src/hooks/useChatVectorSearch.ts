import { useState, useCallback } from 'react';
import { useVectorSearch } from './useVectorSearch';
import { 
  retrieveContext,
  ContextRetrievalOptions
} from '@/services/contextRetrieval';
import { RetrievedContext } from '@/types/chat';
import { SearchConfig } from '@/types/search';

/**
 * Options specific to chat-based vector search
 */
interface ChatVectorSearchOptions {
  similarityThreshold?: number;
  maxChunks?: number;
  searchConfig?: Partial<SearchConfig>;
}

/**
 * Custom hook for chat-specific vector search operations
 * Builds on useVectorSearch with additional context formatting
 */
export function useChatVectorSearch(initialOptions: ChatVectorSearchOptions = {}) {
  const {
    search,
    isLoading: isSearchLoading,
    error: searchError,
    results,
    resetSearch,
    searchConfig,
    updateSearchConfig
  } = useVectorSearch();
  
  // Chat-specific state
  const [context, setContext] = useState<RetrievedContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Default options for chat context retrieval
  const [options, setOptions] = useState<ChatVectorSearchOptions>({
    similarityThreshold: 0.75,
    maxChunks: 10,
    ...initialOptions
  });

  /**
   * Update context retrieval options
   */
  const updateOptions = useCallback((newOptions: Partial<ChatVectorSearchOptions>) => {
    setOptions(prevOptions => ({
      ...prevOptions,
      ...newOptions
    }));
    
    // Update search config if provided
    if (newOptions.searchConfig) {
      updateSearchConfig(newOptions.searchConfig);
    }
  }, [updateSearchConfig]);

  /**
   * Function to retrieve context for a query
   * @param query The query to search for
   * @param projectIds Array of project IDs
   * @param documentIds Array of document IDs
   * @returns Retrieved context or null if error
   */
  const retrieveContextForQuery = useCallback(async (
    query: string,
    projectIds: string[],
    documentIds: string[]
  ): Promise<RetrievedContext | null> => {
    resetSearch();
    setContext(null);
    setError(null);
    setIsLoading(true);
    
    try {
      const retrievalOptions: ContextRetrievalOptions = {
        maxChunks: options.maxChunks,
        similarityThreshold: options.similarityThreshold,
        searchConfig: {
          ...searchConfig,
          matchThreshold: options.similarityThreshold || searchConfig.matchThreshold,
          matchCount: (options.maxChunks || 10) * 2
        }
      };
      
      const contextResult = await retrieveContext(
        query,
        projectIds,
        documentIds,
        retrievalOptions
      );
      
      setContext(contextResult);
      setIsLoading(false);
      return contextResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to retrieve context');
      setError(error);
      setIsLoading(false);
      return null;
    }
  }, [options, resetSearch, searchConfig]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    resetSearch();
    setContext(null);
    setError(null);
  }, [resetSearch]);

  return {
    retrieveContextForQuery,
    context,
    isLoading,
    error,
    searchResults: results,
    options,
    updateOptions,
    reset
  };
}