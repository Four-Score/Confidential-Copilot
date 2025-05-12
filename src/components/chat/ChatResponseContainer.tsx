'use client';

import React, { useState } from 'react';
import { SearchResults } from '@/components/search/SearchResults';
import { ProcessedSearchResult } from '@/types/search';
import { LoadingIndicator } from './LoadingIndicator';
import { ErrorMessage } from './ErrorMessage';

interface ChatResponseContainerProps {
  content: string;
  contextResults: ProcessedSearchResult | null;
  isLoading?: boolean;
  query: string;
  error?: Error | null;
}

export const ChatResponseContainer: React.FC<ChatResponseContainerProps> = ({
  content,
  contextResults,
  isLoading = false,
  query,
  error = null
}) => {
  const [isContextExpanded, setIsContextExpanded] = useState(false);
  const hasContext = contextResults && contextResults.groupedResults.length > 0;

  return (
    <div className="w-full space-y-2">
      {/* Assistant message */}
      <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
        {isLoading ? (
          <div className="p-4 flex justify-center">
            <LoadingIndicator text="Generating response..." size="md" />
          </div>
        ) : error ? (
          <ErrorMessage 
            message={error instanceof Error ? error.message : "An error occurred while generating a response"}
            className="mb-2"
          />
        ) : (
          <div className="prose prose-sm max-w-none">
            {/* existing content rendering code */}
            {content.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < content.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Source context section */}
      {!isLoading && !error && (
        <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
          <button
            onClick={() => setIsContextExpanded(!isContextExpanded)}
            className="w-full p-2 flex justify-between items-center text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-1">
              <svg 
                className="w-4 h-4 text-gray-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <span>
                {hasContext 
                  ? `View sources (${contextResults.totalChunks} results)`
                  : "No source context found"
                }
              </span>
            </div>
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${isContextExpanded ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          
          {isContextExpanded && (
            <div className="p-3 border-t border-gray-200">
              <SearchResults
                results={contextResults}
                isLoading={false}
                error={null}
                query={query}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};