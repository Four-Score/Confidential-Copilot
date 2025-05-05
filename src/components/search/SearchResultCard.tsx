'use client';

import React, { useState, useEffect } from 'react';
import { SimilarityScore } from './SimilarityScore';
import { ChunkSearchResult, GroupedSearchResult } from '@/types/search';
import { KeyManagementService } from '@/services/keyManagement/KeyManagementService';

interface SearchResultCardProps {
  result: GroupedSearchResult;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({ result }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [documentName, setDocumentName] = useState<string>(result.documentName);
  
  // Decrypt document name if it's encrypted
  useEffect(() => {
    const decryptDocName = async () => {
      if (result.isEncrypted) {
        try {
          const kms = KeyManagementService.getInstance();
          if (kms) {
            const decryptedName = await kms.decryptMetadata(result.documentName);
            setDocumentName(decryptedName);
          }
        } catch (error) {
          console.error('Error decrypting document name:', error);
          setDocumentName('[Decryption Failed]');
        }
      }
    };
    
    decryptDocName();
  }, [result.documentName, result.isEncrypted]);
  
  // Get document icon based on document type
  const getDocumentIcon = () => {
    switch (result.documentType) {
      case 'pdf':
        return (
          <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
          </svg>
        );
      case 'website':
        return (
          <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0110 5c-1.563 0-3.033.476-4.247 1.29-1.039.7-1.908 1.66-2.486 2.768-.511.977-.836 2.074-.836 3.242V12a.75.75 0 01-.75.75H.75a.75.75 0 01-.75-.75v-.5a6.5 6.5 0 014.332-6.173zM6 15a1 1 0 100-2 1 1 0 000 2zm3 0a1 1 0 100-2 1 1 0 000 2zm4.75-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zm-2.501-4a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75zm.75-2.25a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4 border border-gray-200 max-h-[80vh] flex flex-col">
      {/* Card Header - Always visible */}
      <div 
        className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
          isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getDocumentIcon()}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 truncate max-w-xs">
              {documentName}
            </h3>
            <p className="text-sm text-gray-500">
              {result.chunks.length} matches · {result.isEncrypted ? 'Encrypted' : 'Unencrypted'} document
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block">
            <SimilarityScore score={result.maxSimilarity} size="sm" />
          </div>
          
          <button
            type="button"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`}
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
        </div>
      </div>
      
      {/* Expanded Content - Chunks with similarity scores */}
      {isExpanded && (
        <div className="border-t border-gray-200 divide-y divide-gray-200 max-h-[60vh] overflow-y-auto flex-1">
          {result.chunks.map((chunk) => (
            <div key={chunk.chunkId} className="px-4 py-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500">
                  Chunk #{chunk.chunkNumber}
                </span>
                <SimilarityScore score={chunk.similarity} />
              </div>
              
              <div className="text-sm text-gray-800 bg-gray-50 rounded p-3 font-mono whitespace-pre-wrap">
                {chunk.content || chunk.encryptedContent}
              </div>
              
              {chunk.metadata && (
                <div className="mt-2 text-xs text-gray-500">
                  <details className="cursor-pointer">
                    <summary className="font-medium">Metadata</summary>
                    <pre className="mt-1 bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(chunk.metadata, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};