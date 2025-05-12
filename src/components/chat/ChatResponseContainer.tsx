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
      <div className="flex">
        {/* Avatar */}
        <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-gray-300 mr-2">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 16M5 16V9.104m14.8 6.196V9.104" />
          </svg>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm flex-grow">
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
              {/* Render formatted message content */}
              {content.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < content.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Source context section */}
      {!isLoading && !error && (
        <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden ml-10">
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
                  ? `View sources (${contextResults?.totalChunks || 0} results)`
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