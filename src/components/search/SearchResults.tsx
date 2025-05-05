'use client';

import React from 'react';
import { SearchResultCard } from './SearchResultCard';
import { ProcessedSearchResult } from '@/types/search';

interface SearchResultsProps {
  results: ProcessedSearchResult | null;
  isLoading: boolean;
  error: Error | null;
  query: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isLoading,
  error,
  query
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-gray-500">Searching for results...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Search error</h3>
            <p className="text-sm text-red-700 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Empty results state
  if (!results || results.groupedResults.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M9 16h6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900">No results found</h3>
        <p className="mt-1 text-gray-500">
          {query 
            ? `No matches found for "${query}". Try different keywords or check your document selection.` 
            : 'Enter a search query to find information in your documents.'}
        </p>
      </div>
    );
  }
  
  // Results display
  return (
    <div className="space-y-6">
      {/* Results header */}
      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          {results.totalChunks} results for "{results.originalQuery}"
        </h2>
      </div>
      
      {/* Results list */}
      <div className="space-y-4">
        {results.groupedResults.map((result) => (
          <SearchResultCard key={result.documentId} result={result} />
        ))}
      </div>
    </div>
  );
};