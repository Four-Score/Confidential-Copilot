'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ProcessedSearchResult, SearchConfig, DEFAULT_SEARCH_CONFIG } from '@/types/search';
import { useVectorSearch } from '@/hooks/useVectorSearch';
import { SelectedDocument } from '@/contexts/DataSelectionContext';

// Define the context state and methods
interface SearchContextType {
  // Search state
  query: string;
  results: ProcessedSearchResult | null;
  isLoading: boolean;
  error: Error | null;
  searchConfig: SearchConfig;
  
  // Search methods
  setQuery: (query: string) => void;
  executeSearch: (projectId: string, documentIds: string[]) => Promise<void>;
  clearSearchResults: () => void;
  resetSearch: () => void;
  updateSearchConfig: (config: Partial<SearchConfig>) => void;
}

// Create the context with default values
const SearchContext = createContext<SearchContextType | undefined>(undefined);

// Provider component
export const SearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for search query
  const [query, setQuery] = useState<string>('');
  
  // Use the vector search hook for core functionality
  const {
    search,
    results,
    isLoading,
    error,
    resetSearch: resetVectorSearch,
    searchConfig,
    updateSearchConfig,
  } = useVectorSearch();
  
  // Execute search with current query
  const executeSearch = useCallback(async (projectId: string, documentIds: string[]) => {
    if (!query.trim()) {
      return;
    }
    
    try {
      await search(query, projectId, documentIds);
    } catch (err) {
      // Error handling is managed by useVectorSearch
      console.error('Search execution error:', err);
    }
  }, [query, search]);
  
  // Clear search results but keep the query
  const clearSearchResults = useCallback(() => {
    resetVectorSearch();
  }, [resetVectorSearch]);
  
  // Reset the entire search state
  const resetSearch = useCallback(() => {
    setQuery('');
    resetVectorSearch();
  }, [resetVectorSearch]);
  
  // Context value
  const value: SearchContextType = {
    query,
    results,
    isLoading,
    error,
    searchConfig,
    setQuery,
    executeSearch,
    clearSearchResults,
    resetSearch,
    updateSearchConfig,
  };
  
  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

// Custom hook for using search context
export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  
  return context;
};